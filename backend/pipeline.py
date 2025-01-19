from typing import List, Dict
from models.bert_ner import BERTNamedEntityRecognizer
from models.bert_rel import BERTRelationshipExtractor
from data_processing.wiki_parser import WikipediaParser
from data_processing.text_preprocessor import TextPreprocessor
from graph.kg_manager import KnowledgeGraphManager

class WikipediaKGPipeline:
    """Pipeline for processing Wikipedia articles and building knowledge graph."""
    
    def __init__(self, config: Dict):
        """
        Initialize pipeline components.
        
        Args:
            config: Configuration dictionary
        """
        self.wiki_parser = WikipediaParser()
        self.preprocessor = TextPreprocessor()
        self.ner_model = BERTNamedEntityRecognizer(
            model_name=config['bert']['model_name'],
            max_length=config['bert']['max_length']
        )
        self.rel_model = BERTRelationshipExtractor(
            model_name=config['bert']['model_name'],
            max_length=config['bert']['max_length']
        )
        self.kg_manager = KnowledgeGraphManager(
            uri=config['database']['uri'],
            user=config['database']['username'],
            password=config['database']['password']
        )
    
    def process_article(self, title: str) -> Dict:
        """
        Process a Wikipedia article and add it to the knowledge graph.
        
        Args:
            title: Article title
            
        Returns:
            Dictionary with processing statistics
        """
        # Fetch article
        article_data = self.wiki_parser.get_article(title)
        if not article_data:
            return {'error': f'Article {title} not found'}
            
        # Preprocess text
        clean_text = self.preprocessor.clean_text(article_data['text'])
        segments = self.preprocessor.split_into_segments(clean_text)
        
        # Process each segment
        all_entities = []
        all_relationships = []
        
        for segment in segments:
            # Extract entities
            entities = self.ner_model.predict(segment)
            all_entities.extend(entities)
            
            # Extract relationships
            relationships = self.rel_model.extract_relationships(segment, entities)
            all_relationships.extend(relationships)
            
        # Add to knowledge graph
        for entity in all_entities:
            self.kg_manager.add_entity(entity)
            
        for relationship in all_relationships:
            self.kg_manager.add_relationship(relationship)
            
        return {
            'title': title,
            'entities_found': len(all_entities),
            'relationships_found': len(all_relationships)
        } 