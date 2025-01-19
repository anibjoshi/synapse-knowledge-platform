from data_processing.wiki_downloader import WikipediaCorpusDownloader

def main():
    print("Downloading Wikipedia dump...")
    downloader = WikipediaCorpusDownloader()
    dump_path = downloader.download_dump()
    print(f"Wikipedia dump downloaded to: {dump_path}")
    
    print("Extracting articles...")
    downloader.extract_articles(dump_path)
    print("Articles extracted successfully")

if __name__ == "__main__":
    main() 