import subprocess
import sys
import os
import json
from pathlib import Path

def process_wiki_dump(input_file, output_dir, options=None):
    """
    Process Wikipedia XML dump using WikiExtractor.
    
    Args:
        input_file (str): Path to the Wikipedia XML dump file
        output_dir (str): Directory where extracted files will be saved
        options (dict, optional): Additional WikiExtractor options
    """
    if options is None:
        options = {}
    
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Default options
    default_options = {
        'bytes': '1M',           # Size of each output file
        'compress': False,       # Don't compress output files
        'json': True,           # Output in JSON format
        'links': True,          # Preserve links
        'sections': True,       # Preserve section structure
        'lists': True,          # Preserve lists
        'references': True,     # Preserve references
        'templates': True,      # Preserve templates
        'min_text_length': 0,   # Include all articles regardless of length
        'filter_disambig_pages': True,  # Filter out disambiguation pages
        'processes': os.cpu_count()  # Use all available CPU cores
    }
    
    # Update default options with user-provided options
    default_options.update(options)
    
    # Prepare command for WikiExtractor
    cmd = [
        sys.executable, '-m', 'wikiextractor.WikiExtractor',
        '--bytes', default_options['bytes'],
        '--output', output_dir,
        '--processes', str(default_options['processes'])
    ]
    
    # Add boolean flags
    if default_options['json']:
        cmd.append('--json')
    if default_options['links']:
        cmd.append('--links')
    if default_options['sections']:
        cmd.append('--sections')
    if default_options['lists']:
        cmd.append('--lists')
    if default_options['references']:
        cmd.append('--references')
    if default_options['templates']:
        cmd.append('--templates')
    if default_options['filter_disambig_pages']:
        cmd.append('--filter_disambig_pages')
    if default_options['compress']:
        cmd.append('--compress')
        
    # Add min text length
    cmd.extend(['--min_text_length', str(default_options['min_text_length'])])
    
    # Add input file as the last argument
    cmd.append(input_file)
    
    # Run WikiExtractor as a subprocess
    subprocess.run(cmd, check=True)

def read_extracted_files(output_dir):
    """
    Generator function to read and yield extracted articles.
    
    Args:
        output_dir (str): Directory containing extracted files
        
    Yields:
        dict: Article data including title, text, and metadata
    """
    for root, _, files in os.walk(output_dir):
        for file in files:
            if file.startswith('wiki_'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            yield json.loads(line)

if __name__ == "__main__":
    # Example usage
    input_file = r"C:\Users\Ani J\Downloads\enwiki-20241201-pages-articles-multistream.xml"
    output_dir = "extracted_wiki"
    
    # Process the Wikipedia dump
    process_wiki_dump(input_file, output_dir, {
        'bytes': '10M',  # Create larger output files
        'processes': 4   # Use 4 CPU cores
    })
    
    # Example of reading and processing extracted articles
    for article in read_extracted_files(output_dir):
        title = article['title']
        text = article['text']
        
        # Do something with each article
        print(f"Processing article: {title}")
        # Add your processing logic here