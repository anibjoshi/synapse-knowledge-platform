import sys
import os.path
import re
import argparse
import bz2
import json
import html
import mmap
from multiprocessing import Pool, cpu_count

# Regex patterns
tagRE = re.compile(r'(.*?)<(/?\w+)[^>]*>(?:([^<]*)(<.*?>)?)?')
wikiLinkRE = re.compile(r'\[\[([^\]]+)\]\]')
refRE = re.compile(r'<ref[^>]*>([^<]+)</ref>')
wikiCodeRE = re.compile(r'{{[^}]+}}')
htmlTagsRE = re.compile(r'<[^>]+>')
urlRE = re.compile(r'(?:http[s]?://[^\s<>\[\]]+)')
sectionRE = re.compile(r'(={2,})\s*([^=]+?)\s*\1')

def extract_wiki_links(text):
    """Extract and clean wiki links from text."""
    links = []
    for link in wikiLinkRE.findall(text):
        # Skip category and special links
        if ':' in link:
            continue
        # Get base link without display text
        links.append(link.split('|')[0])
    return links

def extract_references(text):
    """Extract references from text."""
    return [ref.strip() for ref in refRE.findall(text) if ref.strip()]

def extract_sections(text):
    """Extract and structure text into sections and subsections."""
    sections = []
    current_section = {
        "title": "Introduction",
        "level": 0,
        "content": [],
        "links": [],
        "references": [],
        "external_urls": [],
        "subsections": []
    }
    current_subsection = None
    
    lines = text.split('\n')
    
    for line in lines:
        match = sectionRE.match(line)
        if match:
            level = len(match.group(1))
            title = match.group(2).strip()
            
            if level == 2:  # Main section
                if current_section["content"] or current_section["subsections"]:
                    sections.append(current_section)
                current_section = {
                    "title": title,
                    "level": level,
                    "content": [],
                    "links": [],
                    "references": [],
                    "external_urls": [],
                    "subsections": []
                }
                current_subsection = None
            elif level > 2:  # Subsection
                if current_subsection and current_subsection["content"]:
                    current_section["subsections"].append(current_subsection)
                current_subsection = {
                    "title": title,
                    "level": level,
                    "content": [],
                    "links": [],
                    "references": [],
                    "external_urls": []
                }
        else:
            if line.strip():
                if current_subsection is not None:
                    current_subsection["content"].append(line)
                    current_subsection["links"].extend(extract_wiki_links(line))
                    current_subsection["references"].extend(extract_references(line))
                    if "http" in line:
                        current_subsection["external_urls"].extend(urlRE.findall(line))
                else:
                    current_section["content"].append(line)
                    current_section["links"].extend(extract_wiki_links(line))
                    current_section["references"].extend(extract_references(line))
                    if "http" in line:
                        current_section["external_urls"].extend(urlRE.findall(line))
    
    # Add final sections
    if current_subsection and current_subsection["content"]:
        current_section["subsections"].append(current_subsection)
    if current_section["content"] or current_section["subsections"]:
        sections.append(current_section)
    
    return sections

def clean_text(text):
    """Clean and normalize text content."""
    text = html.unescape(text)
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)  # Wiki links
    text = refRE.sub('', text)  # References
    text = wikiCodeRE.sub('', text)  # Wiki code
    text = htmlTagsRE.sub('', text)  # HTML tags
    
    # Clean up punctuation and spacing
    text = re.sub(r'\([^a-zA-Z]*\)', '', text)  # Remove numeric parentheticals
    text = re.sub(r'[|#\{\}\[\]<>*\^\\\n\r\t]', '', text)  # Special characters
    text = re.sub(r'[,\s]+,', ',', text)  # Multiple commas
    text = re.sub(r'[.\s]+\.', '.', text)  # Multiple periods
    text = re.sub(r'[\s\.,]+(?=[\s\.,])', '', text)  # Consecutive punctuation
    
    # Quote handling
    text = text.replace('\\"', '"').replace('""', '"')
    text = re.sub(r'"+', '"', text)
    text = text.replace('" ', '"').replace(' "', '"')
    
    # Final cleanup
    text = re.sub(r'\s*([.,!?;:])\s*', r'\1 ', text)  # Normalize punctuation spacing
    text = re.sub(r'\s+', ' ', text)  # Multiple spaces
    return text.strip()

def clean_section_text(section_data):
    """Clean text while preserving section structure."""
    cleaned_sections = []
    
    for section in section_data:
        cleaned_section = {
            "title": clean_text(section["title"]),
            "level": section["level"],
            "content": clean_text('\n'.join(section["content"])),
            "links": list(dict.fromkeys(section["links"])),  # Remove duplicates
            "references": list(dict.fromkeys(section["references"])),
            "external_urls": list(dict.fromkeys(section["external_urls"])),
            "subsections": []
        }
        
        for subsection in section["subsections"]:
            cleaned_subsection = {
                "title": clean_text(subsection["title"]),
                "level": subsection["level"],
                "content": clean_text('\n'.join(subsection["content"])),
                "links": list(dict.fromkeys(subsection["links"])),
                "references": list(dict.fromkeys(subsection["references"])),
                "external_urls": list(dict.fromkeys(subsection["external_urls"]))
            }
            cleaned_section["subsections"].append(cleaned_subsection)
            
        cleaned_sections.append(cleaned_section)
    
    return cleaned_sections

def find_page_position(input_file, page_id):
    """Find the starting position of a page in the file."""
    with open(input_file, 'rb') as f:
        mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
        page_start = mm.find(f'<page>'.encode())
        while page_start != -1:
            id_start = mm.find(f'<id>{page_id}</id>'.encode(), page_start)
            next_page = mm.find(b'<page>', page_start + 6)
            
            if id_start != -1 and (next_page == -1 or id_start < next_page):
                mm.close()
                return page_start
            
            page_start = next_page
        mm.close()
    return -1

def process_page(input_file, page_id):
    """Process a single page."""
    output_file = f"page_{page_id}_extracted.json"
    
    try:
        pos = find_page_position(input_file, page_id)
        if pos == -1:
            return None
            
        with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
            f.seek(pos)
            page_content = []
            for line in f:
                page_content.append(line)
                if '</page>' in line:
                    break
            
            text_content = ''.join(page_content)
            
            page_data = {
                "id": page_id,
                "parent_id": None,
                "title": None,
                "sections": [],
                "links": [],
                "references": [],
                "external_urls": []
            }
            
            raw_sections = extract_sections(text_content)
            page_data["sections"] = clean_section_text(raw_sections)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(page_data, f, ensure_ascii=False, indent=2)
            
            return page_id
            
    except Exception as e:
        print(f"Error processing page {page_id}: {e}")
        return None

def process_data(input_file, page_ids, parallel=False):
    """Process one or more pages from Wikipedia dump."""
    # Convert single ID to list if needed
    if isinstance(page_ids, str):
        page_ids = [page_ids]
    
    # Check JSONL index if available
    jsonl_file = f"{os.path.splitext(input_file)[0]}_pages.jsonl"
    if os.path.exists(jsonl_file):
        valid_ids = set()
        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                if data['id'] in page_ids:
                    valid_ids.add(data['id'])
        
        invalid_ids = set(page_ids) - valid_ids
        if invalid_ids:
            print(f"Warning: Page IDs not found in index: {invalid_ids}")
            page_ids = list(valid_ids)
    
    if not page_ids:
        print("No valid page IDs to process.")
        return
    
    if parallel and len(page_ids) > 1:
        # Use multiprocessing for multiple pages
        with Pool(cpu_count() - 1) as pool:
            args = [(input_file, page_id) for page_id in page_ids]
            results = pool.starmap(process_page, args)
            processed = [r for r in results if r is not None]
            print(f"Successfully processed {len(processed)} pages")
    else:
        # Process pages sequentially
        for page_id in page_ids:
            result = process_page(input_file, page_id)
            if result:
                print(f"Successfully processed page {page_id}")

def main():
    parser = argparse.ArgumentParser(description="Extract and process Wikipedia pages")
    parser.add_argument("input", help="XML wiki dump file")
    parser.add_argument("--id", required=True, nargs='+', help="Page ID(s) to extract")
    parser.add_argument("--parallel", action="store_true", help="Use parallel processing for multiple pages")
    
    args = parser.parse_args()
    process_data(args.input, args.id, args.parallel)

if __name__ == '__main__':
    main()
