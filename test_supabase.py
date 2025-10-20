
import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

def main():
    """
    Connects to Supabase, inserts a device and a reading,
    and verifies the data was inserted.
    """
    print("--- Supabase Backend Test Script ---")
    
    # --- Step 1: Load Environment Variables ---
    print("Loading environment variables from .env file...")
    load_dotenv()

    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("\nERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
        print("Please create a .env file in the same directory as this script and add them.")
        return

    # --- Step 2: Connect to Supabase ---
    try:
        print("Connecting to Supabase...")
        supabase: Client = create_client(url, key)
        print("Connection successful.")

        # --- Step 3: Insert a new device ---
        print("\nAttempting to insert a new device...")
        device_data = {
            "name": "Test Device (Python)",
            "location": "Test Lab",
            "lat": 40.7128,
            "lng": -74.0060
        }
        device_insert_result = supabase.table("devices").insert(device_data).execute()

        # The result object has 'data' and 'error' attributes
        if len(device_insert_result.data) > 0:
            inserted_device = device_insert_result.data[0]
            device_id = inserted_device['id']
            print(f"  -> Successfully inserted device with ID: {device_id}")

            # --- Step 4: Insert a reading for the new device ---
            print("\nAttempting to insert a reading...")
            reading_data = {
                "device_id": device_id,
                "co_level": 55.5,
                "timestamp": "2024-07-29T10:00:00Z"
            }
            reading_insert_result = supabase.table("readings").insert(reading_data).execute()

            if len(reading_insert_result.data) > 0:
                print("  -> Successfully inserted reading.")

                # --- Step 5: Verify data by querying it back ---
                print(f"\nVerifying data by fetching device {device_id}...")
                fetch_result = supabase.table("devices").select("*, readings(*)").eq("id", device_id).execute()

                if len(fetch_result.data) > 0:
                    print("\n--- VERIFICATION SUCCESS ---")
                    print("Fetched data from Supabase:")
                    print(fetch_result.data[0])
                    print("\nTest complete! Your backend is working correctly.")
                    print("You can now check your 'devices' and 'readings' tables in the Supabase dashboard.")
                else:
                    print("\n--- VERIFICATION FAILED ---")
                    print("Could not fetch the device data back. Check your RLS policies or table schema.")

            else:
                print("\n--- READING INSERT FAILED ---")
                print(f"Error inserting reading: {reading_insert_result.error}")
        else:
            print("\n--- DEVICE INSERT FAILED ---")
            print(f"Error inserting device: {device_insert_result.error}")
            print("  -> Double-check your SUPABASE_SERVICE_KEY.")
            print("  -> Ensure you have run the SQL script to create the 'devices' table.")

    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        print("Please check your Supabase URL, network connection, and that the 'supabase' library is installed.")

if __name__ == "__main__":
    main()

