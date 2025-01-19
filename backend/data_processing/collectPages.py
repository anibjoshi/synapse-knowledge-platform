import sys
import os.path
import re
import argparse
import bz2
import json
from tqdm import tqdm  # For progress bar

# Regex pattern for XML tags
tagRE = re.compile(r'(.*?)<(/?\w+)[^>]*>(?:([^<]*)(<.*?>)?)?')

def count_pages(input_file):
    """Count total number of pages in the XML dump for progress bar."""
    count = 0
    try:
        with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if '<page>' in line:
                    count += 1
    except Exception as e:
        print(f"Error counting pages: {e}")
        return 0
    return count

def collect_pages(input_file):
    """
    Extract all page IDs and titles from Wikipedia dump.
    Stores results in JSONL format for efficient processing.
    """
    # Create output filename based on input filename
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = f"{base_name}_pages.jsonl"
    
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

    # Open output file in write mode
    output_stream = open(output_file, 'w', encoding='utf-8', buffering=buffer_size)
    
    current_page = {"id": None, "title": None, "namespace": None}
    in_page = False
    total_pages = count_pages(input_file)
    
    try:
        with tqdm(total=total_pages, desc="Processing pages") as pbar:
            for line in input_stream:
                if '<page>' in line:
                    current_page = {"id": None, "title": None, "namespace": None}
                    in_page = True
                    continue
                    
                if in_page:
                    if '<id>' in line and current_page["id"] is None:
                        match = tagRE.search(line)
                        if match and match.group(2) == 'id':
                            current_page["id"] = match.group(3)
                    
                    elif '<title>' in line:
                        match = tagRE.search(line)
                        if match and match.group(2) == 'title':
                            current_page["title"] = match.group(3)
                    
                    elif '<ns>' in line:
                        match = tagRE.search(line)
                        if match and match.group(2) == 'ns':
                            current_page["namespace"] = match.group(3)
                    
                    elif '</page>' in line:
                        if current_page["id"] and current_page["title"]:
                            # Write to JSONL file
                            output_stream.write(json.dumps(current_page, ensure_ascii=False) + '\n')
                            pbar.update(1)
                        in_page = False
    
    except Exception as e:
        print(f"Error processing file: {e}")
    
    finally:
        input_stream.close()
        output_stream.close()
        print(f"\nResults written to {output_file}")

def main():
    parser = argparse.ArgumentParser(description="Collect all page IDs and titles from Wikipedia dump")
    parser.add_argument("input", help="XML wiki dump file")
    
    args = parser.parse_args()
    collect_pages(args.input)

if __name__ == '__main__':
    main() 