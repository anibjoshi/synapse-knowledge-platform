import sys
import os.path
import re
import argparse
import bz2
import json

# Regex pattern for XML tags
tagRE = re.compile(r'(.*?)<(/?\w+)[^>]*>(?:([^<]*)(<.*?>)?)?')

def extract_raw_xml(input_file, id, templates=False):
    """Extract raw XML for a specific page ID from Wikipedia dump."""
    output_file = f"page_{id}_raw.xml"
    buffer_size = 65536  # 64KB buffer
    
    try:
        if input_file.lower().endswith(".bz2"):
            input_stream = bz2.open(input_file, mode='rt', encoding='utf-8')
        else:
            input_stream = open(input_file, 'r', encoding='utf-8', errors='ignore', 
                              buffering=buffer_size)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error opening file: {e}")
        sys.exit(1)

    current_page = []
    in_page = False
    found_id = False
    
    try:
        for line in input_stream:
            if '<page>' in line:
                current_page = [line]
                in_page = True
                found_id = False
                continue
                
            if in_page:
                current_page.append(line)
                
                if not found_id and '<id>' in line:
                    match = tagRE.search(line)
                    if match and match.group(2) == 'id':
                        page_id = match.group(3)
                        if page_id == id:
                            found_id = True
                        elif not templates:
                            current_page = []
                            in_page = False
                
                if '</page>' in line:
                    if found_id:
                        try:
                            with open(output_file, 'w', encoding='utf-8') as f:
                                f.write(''.join(current_page))
                            print(f"Raw XML successfully written to {output_file}")
                            if not templates:
                                break
                        except Exception as e:
                            print(f"Error writing to file: {e}")
                    
                    current_page = []
                    in_page = False
                    found_id = False
    
    finally:
        input_stream.close()

def main():
    parser = argparse.ArgumentParser(description="Extract raw XML for a Wikipedia page")
    parser.add_argument("input", help="XML wiki dump file")
    parser.add_argument("--id", default="1", help="article ID to extract")
    parser.add_argument("--template", action="store_true", 
                       help="whether article is a template")
    
    args = parser.parse_args()
    extract_raw_xml(args.input, args.id, args.template)

if __name__ == '__main__':
    main() 