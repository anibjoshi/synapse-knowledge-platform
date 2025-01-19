import sys
import os.path
import re
import argparse
import bz2
import json
from tqdm import tqdm
from multiprocessing import Pool, cpu_count
import math
import mmap  # For efficient file reading

# Import the processing functions from extractPage.py
from extractPage import extract_sections, clean_section_text

# Regex patterns
tagRE = re.compile(r'(.*?)<(/?\w+)[^>]*>(?:([^<]*)(<.*?>)?)?')

def process_page_content(page_content):
    """Process a single page's content and return structured data."""
    try:
        # Extract basic metadata
        page_data = {
            "id": None,
            "title": None,
            "namespace": None,
            "sections": []
        }
        
        # Parse the content for metadata
        for line in page_content:
            if '<id>' in line and page_data["id"] is None:
                match = tagRE.search(line)
                if match and match.group(2) == 'id':
                    page_data["id"] = match.group(3)
            elif '<title>' in line:
                match = tagRE.search(line)
                if match and match.group(2) == 'title':
                    page_data["title"] = match.group(3)
            elif '<ns>' in line:
                match = tagRE.search(line)
                if match and match.group(2) == 'ns':
                    page_data["namespace"] = match.group(3)
        
        # Only process main namespace articles
        if page_data["namespace"] == "0":
            # Process sections
            raw_sections = extract_sections(''.join(page_content))
            page_data["sections"] = clean_section_text(raw_sections)
            return page_data
        
        return None
        
    except Exception as e:
        print(f"Error processing page {page_data.get('id', 'unknown')}: {e}")
        return None

def process_chunk(args):
    """Process a chunk of the XML file."""
    input_file, start_pos, chunk_size, output_dir, chunk_num, max_pages = args
    
    try:
        # Use memory mapping for efficient reading
        with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
            # Memory map the input file for faster reading
            mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
            mm.seek(start_pos)
            
            output_file = os.path.join(output_dir, f"wiki_pages_{chunk_num:04d}.jsonl")
            current_page = []
            in_page = False
            processed_pages = []
            local_count = 0
            
            with open(output_file, 'w', encoding='utf-8', buffering=8192) as out_f:  # Adjusted buffer size
                bytes_read = 0
                
                while bytes_read < chunk_size:
                    if max_pages and (local_count >= max_pages):
                        break
                    
                    # Read line efficiently from memory mapped file
                    line = mm.readline().decode('utf-8', errors='ignore')
                    if not line:
                        break
                    
                    bytes_read = mm.tell() - start_pos
                    
                    if '<page>' in line:
                        current_page = [line]
                        in_page = True
                    elif in_page:
                        current_page.append(line)
                        if '</page>' in line:
                            page_data = process_page_content(current_page)
                            if page_data:
                                out_f.write(json.dumps(page_data, ensure_ascii=False) + '\n')
                                processed_pages.append({
                                    "id": page_data["id"],
                                    "title": page_data["title"],
                                    "file": f"wiki_pages_{chunk_num:04d}.jsonl"
                                })
                                local_count += 1
                                # Flush periodically to avoid memory buildup
                                if local_count % 10 == 0:
                                    out_f.flush()
                            current_page = []
                            in_page = False
            
            mm.close()
        return chunk_num, processed_pages, local_count
        
    except Exception as e:
        print(f"Error processing chunk {chunk_num}: {e}")
        return None

def process_all_pages(input_file, output_dir="processed_pages", chunk_size_mb=100, max_pages=None):
    """Process all pages in the Wikipedia dump file."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Get optimal chunk size based on system memory
    available_memory = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')  # Total RAM
    chunk_size = min(chunk_size_mb * 1024 * 1024, available_memory // (4 * cpu_count()))
    
    file_size = os.path.getsize(input_file)
    num_chunks = math.ceil(file_size / chunk_size)
    
    # Optimize number of processes based on CPU cores and memory
    num_processes = min(cpu_count() - 1, max(1, available_memory // (2 * 1024 * 1024 * 1024)))  # Leave 2GB per process
    
    chunk_args = [(input_file, i * chunk_size, chunk_size, output_dir, i, max_pages) 
                 for i in range(num_chunks)]
    
    index_file = os.path.join(output_dir, "page_index.jsonl")
    with open(index_file, 'w', encoding='utf-8', buffering=8192) as index_stream:
        total_processed = 0
        
        with Pool(num_processes) as pool:
            with tqdm(total=max_pages if max_pages else None, desc="Processing pages") as pbar:
                for result in pool.imap_unordered(process_chunk, chunk_args):
                    if result:
                        chunk_num, processed_pages, count = result
                        for page in processed_pages:
                            if not max_pages or total_processed < max_pages:
                                index_stream.write(json.dumps(page, ensure_ascii=False) + '\n')
                                total_processed += 1
                                pbar.update(1)
                        
                        # Flush index periodically
                        if total_processed % 100 == 0:
                            index_stream.flush()
                    
                    if max_pages and total_processed >= max_pages:
                        break
        
        print(f"\nProcessed {total_processed} pages")
        print(f"Index written to {index_file}")

def main():
    parser = argparse.ArgumentParser(description="Process all pages from Wikipedia dump")
    parser.add_argument("input", help="XML wiki dump file")
    parser.add_argument("--output-dir", default="processed_pages",
                       help="Output directory for JSONL files")
    parser.add_argument("--chunk-size", type=int, default=2048,
                       help="Size of each output file in MB")
    parser.add_argument("--max-pages", type=int, help="Maximum number of pages to process (optional)")
    
    args = parser.parse_args()
    process_all_pages(args.input, args.output_dir, args.chunk_size, args.max_pages)

if __name__ == '__main__':
    main() 