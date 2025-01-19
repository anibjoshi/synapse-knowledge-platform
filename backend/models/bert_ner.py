from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch
from typing import List, Dict
from transformers import pipeline

class BERTNamedEntityRecognizer:
    """Named Entity Recognition using BERT model."""
    
    def __init__(self, model_name: str = "answerdotai/ModernBERT-base", max_length: int = 8192):
        """
        Initialize ModernBERT NER model.
        
        Args:
            model_name: Pre-trained ModernBERT model name
            max_length: Maximum sequence length (8192 for ModernBERT)
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        # Initialize the model with NER classification head
        self.model = AutoModelForTokenClassification.from_pretrained(
            model_name,
            num_labels=9,  # Standard NER labels (PER, ORG, LOC, etc.)
            id2label={
                0: "O",
                1: "B-PER", 2: "I-PER",
                3: "B-ORG", 4: "I-ORG",
                5: "B-LOC", 6: "I-LOC",
                7: "B-MISC", 8: "I-MISC"
            }
        )
        self.model.eval()
        self.max_length = max_length
        
        # Initialize NER pipeline
        self.ner_pipeline = pipeline(
            "ner",
            model=self.model,
            tokenizer=self.tokenizer,
            aggregation_strategy="simple"
        )
        
    def predict(self, text: str) -> List[Dict[str, str]]:
        """
        Perform NER on input text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of detected entities with their types, scores and positions
        """
        # Use the pipeline for prediction
        entities = self.ner_pipeline(
            text,
            max_length=self.max_length,
            truncation=True,
            batch_size=1
        )
        
        # Convert pipeline output to our format
        formatted_entities = [{
            'text': entity['word'],
            'type': entity['entity_group'],
            'score': entity['score'],
            'start': entity['start'],
            'end': entity['end']
        } for entity in entities]
        
        return formatted_entities 