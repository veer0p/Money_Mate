# Data Processing Module

This module handles data processing and insights generation for the Money Mate application.

## Directory Structure

```
data_processing/
├── config/         # Configuration files
├── models/         # Data models and schemas
├── scripts/        # Processing scripts
└── utils/          # Utility functions
```

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

- Copy `.env.example` to `.env`
- Update the database configuration in `.env`

## Usage

Run the main processing script:

```bash
python scripts/process_insights.py
```

## Features

- Data processing and transformation
- Financial insights generation
- Database operations
- Utility functions for data manipulation
