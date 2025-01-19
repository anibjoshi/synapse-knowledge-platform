from typing import Dict, List, Optional, Union
from neo4j import GraphDatabase
from datetime import datetime

class KnowledgeGraphManager:
    """Manages operations on the Knowledge Graph."""
    
    def __init__(self, uri: str, user: str, password: str):
        """
        Initialize connection to Neo4j database.
        
        Args:
            uri: Neo4j database URI
            user: Database username
            password: Database password
        """
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        
    def close(self):
        """Close the database connection."""
        self.driver.close()
        
    def create_constraints(self):
        """Create necessary constraints for the knowledge graph."""
        with self.driver.session() as session:
            # Create constraints for unique IDs
            constraints = [
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Article) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Section) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Reference) REQUIRE n.id IS UNIQUE",
                "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Category) REQUIRE n.id IS UNIQUE"
            ]
            
            for constraint in constraints:
                session.run(constraint)
                
    def clear_graph(self):
        """Clear all nodes and relationships from the graph."""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            
    def add_entity(self, entity: Dict, merge: bool = True) -> None:
        """
        Add entity to knowledge graph.
        
        Args:
            entity: Entity information including type and properties
            merge: If True, merge with existing entity instead of creating new
        """
        with self.driver.session() as session:
            # Add timestamp if not present
            if 'timestamp' not in entity:
                entity['timestamp'] = datetime.now().isoformat()
                
            if merge:
                query = """
                MERGE (e:{label} {{id: $id}})
                SET e += $properties
                """.format(label=entity['type'])
            else:
                query = """
                CREATE (e:{label})
                SET e = $properties
                """.format(label=entity['type'])
                
            session.run(query, id=entity['id'], properties=entity)
            
    def add_relationship(self, relationship: Dict, merge: bool = True) -> None:
        """
        Add relationship between entities.
        
        Args:
            relationship: Relationship information including source and target entities
            merge: If True, merge with existing relationship instead of creating new
        """
        with self.driver.session() as session:
            if merge:
                query = """
                MATCH (source {id: $source_id})
                MATCH (target {id: $target_id})
                MERGE (source)-[r:$rel_type]->(target)
                SET r += $properties
                """
            else:
                query = """
                MATCH (source {id: $source_id})
                MATCH (target {id: $target_id})
                CREATE (source)-[r:$rel_type]->(target)
                SET r = $properties
                """
                
            session.run(query, 
                       source_id=relationship['source_id'],
                       target_id=relationship['target_id'],
                       rel_type=relationship['type'],
                       properties=relationship.get('properties', {}))
                       
    def get_entity(self, entity_id: str) -> Optional[Dict]:
        """
        Retrieve entity by ID.
        
        Args:
            entity_id: Unique identifier of the entity
            
        Returns:
            Entity data if found, None otherwise
        """
        with self.driver.session() as session:
            result = session.run(
                "MATCH (e {id: $id}) RETURN e",
                id=entity_id
            )
            record = result.single()
            return dict(record['e']) if record else None
            
    def get_relationships(self, entity_id: str, rel_type: Optional[str] = None) -> List[Dict]:
        """
        Get all relationships for an entity.
        
        Args:
            entity_id: Entity ID to get relationships for
            rel_type: Optional relationship type to filter by
            
        Returns:
            List of relationship dictionaries
        """
        with self.driver.session() as session:
            query = """
            MATCH (e {id: $id})-[r{}]->(target)
            RETURN type(r) as type, r as props, target.id as target_id
            UNION
            MATCH (source)-[r{}]->(e {id: $id})
            RETURN type(r) as type, r as props, source.id as source_id
            """.format(
                f":{rel_type}" if rel_type else "",
                f":{rel_type}" if rel_type else ""
            )
            
            results = session.run(query, id=entity_id)
            relationships = []
            
            for record in results:
                rel = {
                    'type': record['type'],
                    'properties': dict(record['props']),
                }
                if 'source_id' in record:
                    rel['source_id'] = record['source_id']
                    rel['target_id'] = entity_id
                else:
                    rel['source_id'] = entity_id
                    rel['target_id'] = record['target_id']
                relationships.append(rel)
                
            return relationships
            
    def search_entities(self, label: Optional[str] = None, properties: Dict = None) -> List[Dict]:
        """
        Search for entities matching given criteria.
        
        Args:
            label: Optional entity type to filter by
            properties: Optional property values to match
            
        Returns:
            List of matching entities
        """
        with self.driver.session() as session:
            where_clauses = []
            params = {}
            
            if properties:
                for key, value in properties.items():
                    where_clauses.append(f"e.{key} = ${key}")
                    params[key] = value
                    
            query = f"""
            MATCH (e{f':{label}' if label else ''})
            {f'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''}
            RETURN e
            """
            
            results = session.run(query, **params)
            return [dict(record['e']) for record in results] 