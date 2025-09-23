#!/usr/bin/env python3
"""
Transaction Extraction Runner
Usage: python run_extraction.py [--limit NUMBER]
"""

import argparse
from transaction_extractor import TransactionExtractor

def main():
    parser = argparse.ArgumentParser(description='Process transaction messages')
    parser.add_argument('--limit', type=int, default=None, help='Number of messages to process (default: all)')
    args = parser.parse_args()
    
    # Configure your API base URL here
    API_BASE_URL = "http://localhost:5000/api"
    
    print(f"Starting transaction extraction with limit: {args.limit}...")
    extractor = TransactionExtractor(API_BASE_URL)
    extractor.process_messages(args.limit)
    print("Extraction completed!")

if __name__ == "__main__":
    main()