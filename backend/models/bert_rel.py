from transformers import AutoTokenizer, AutoModel
from typing import List, Dict, Tuple
import torch
import torch.nn.functional as F

class BERTRelationshipExtractor:
    """Relationship extraction using ModernBERT model."""
    
    def __init__(self, model_name: str = "answerdotai/ModernBERT-base", max_length: int = 8192):
        """
        Initialize ModernBERT relationship extraction model.
        
        Args:
            model_name: Pre-trained ModernBERT model name
            max_length: Maximum sequence length (8192 for ModernBERT)
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        # Initialize ModernBERT base model
        self.model = AutoModel.from_pretrained(
            model_name,
            add_pooling_layer=True  # Ensure we get the pooled output for relationship scoring
        )
        self.model.eval()
        self.max_length = max_length
        
        # Add special tokens for entity marking
        special_tokens = {"additional_special_tokens": ["[E1]", "[/E1]", "[E2]", "[/E2]"]}
        self.tokenizer.add_special_tokens(special_tokens)
        self.model.resize_token_embeddings(len(self.tokenizer))
        
    def extract_relationships(self, text: str, entities: List[Dict]) -> List[Dict]:
        """
        Extract relationships between entities in text.
        
        Args:
            text: Input text
            entities: List of entities detected by NER
            
        Returns:
            List of relationships between entities
        """
        if len(entities) < 2:
            return []
            
        relationships = []
        
        # Extract relationships between each pair of entities
        for i, entity1 in enumerate(entities[:-1]):
            for entity2 in entities[i+1:]:
                # Create input text with special tokens highlighting entities
                marked_text = (
                    f"{text[:entity1['start']]}[E1]{text[entity1['start']:entity1['end']]}[/E1]"
                    f"{text[entity1['end']:entity2['start']]}[E2]{text[entity2['start']:entity2['end']]}[/E2]"
                    f"{text[entity2['end']:]}"
                )
                
                # Encode text
                inputs = self.tokenizer(
                    marked_text,
                    return_tensors="pt",
                    max_length=self.max_length,
                    truncation=True,
                    padding=True
                )
                
                # Get embeddings
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    embeddings = outputs.last_hidden_state[:, 0, :]  # Use [CLS] token embedding
                
                # Simple relationship scoring using cosine similarity
                similarity = F.cosine_similarity(embeddings, embeddings).item()
                
                if similarity > 0.5:  # Threshold for relationship detection
                    relationships.append({
                        'source': entity1['text'],
                        'source_type': entity1['type'],
                        'target': entity2['text'],
                        'target_type': entity2['type'],
                        'score': similarity
                    })
        
        return relationships 