import os

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
MODELS_DIR = os.path.join(DATA_DIR, "models")

# Wikipedia settings
WIKI_DUMP_URL = "https://dumps.wikimedia.org/enwiki/latest/enwiki-latest-pages-articles.xml.bz2"

# Model settings
MODEL_NAME = "answerdotai/ModernBERT-base"
MAX_LENGTH = 8192
BATCH_SIZE = 32

# Database settings
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j" 