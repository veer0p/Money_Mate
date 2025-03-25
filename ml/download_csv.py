import requests
import os

# API URL with query parameter
url = "http://localhost:5000/api/messages/export"
params = {"user_id": "c6762be8-7e98-4795-a4e2-896b01d758dc"}

# Folder where you want to save the CSV file
save_folder = "exported_data"
os.makedirs(save_folder, exist_ok=True)  # Create folder if it doesn't exist

# File path to save CSV
csv_file_path = os.path.join(save_folder, "messages_export.csv")

# Send GET request to API
response = requests.post(url, params=params)

# Check if the request was successful
if response.status_code == 200:
    # Save the response content as a CSV file
    with open(csv_file_path, "wb") as file:
        file.write(response.content)
    print(f"CSV file saved successfully at: {csv_file_path}")
else:
    print(f"Failed to fetch data. Status code: {response.status_code}")
