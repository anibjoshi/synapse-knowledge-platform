wikipedia-kg/
├── backend/
│   ├── __init__.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── development.yaml
│   │   └── production.yaml
│   ├── models/
│   │   ├── __init__.py
│   │   ├── bert_ner.py
│   │   └── bert_rel.py
│   ├── data_processing/
│   │   ├── __init__.py
│   │   ├── wiki_parser.py
│   │   └── text_preprocessor.py
│   ├── graph/
│   │   ├── __init__.py
│   │   └── kg_manager.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_ner.py
│   │   ├── test_rel.py
│   │   └── test_kg.py
│   ├── pipeline.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Graph.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── data/
│   ├── raw/
│   ├── processed/
│   └── models/
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── README.md 