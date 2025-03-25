import pandas as pd

# Load the dataset
df = pd.read_csv("messages_export.csv")  # Replace with actual file name

# Keep only non-numeric sender values
df_filtered = df[df['sender'].astype(str).str.contains(r'[A-Za-z]')]

# Get unique sender names
unique_senders = df_filtered['sender'].unique()

# Print the unique sender names
print("Unique Senders:")
print(unique_senders)
