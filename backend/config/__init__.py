import os
import yaml
from typing import Dict
from pathlib import Path

def load_config(env: str = "development") -> Dict:
    """
    Load configuration based on environment.
    
    Args:
        env: Environment name ("development" or "production")
        
    Returns:
        Configuration dictionary
    """
    config_path = Path(__file__).parent / f"{env}.yaml"
    
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    # Override with environment variables if they exist
    if 'NEO4J_PASSWORD' in os.environ:
        config['database']['password'] = os.environ['NEO4J_PASSWORD']
        
    return config 

# Empty file to make the directory a Python package 