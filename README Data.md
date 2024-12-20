//README Data.md

Song Locations and JSON Driver Files Description

This section describes how the app manages song locations and uses JSON driver files to fetch and organize data for the quiz. The system ensures that the songs and their metadata are properly integrated into the game mechanics.

1. Song Locations

Songs are stored in a cloud-based location, and the app retrieves their audio files dynamically during gameplay. The specific song location and naming conventions ensure efficient fetching and organization.

Cloud Storage Setup
• Storage: Songs are hosted on a blob storage service, such as Azure Blob Storage.
• Base URL:

https://namethattangotune.blob.core.windows.net/djsongs

    •	File Naming Convention:
    •	Each song is uniquely identified by its djId or songID in the metadata.
    •	Song file names in storage correspond to the djId value and have a .mp3 extension.
    •	Example:

https://namethattangotune.blob.core.windows.net/djsongs/12345.mp3

Key Features of Song Storage:
• Centralized Storage:
• All songs are hosted under the same base URL.
• Unique Identification:
• Each song’s file name matches the metadata’s djId field for seamless integration.
• Efficient Fetching:
• The app dynamically constructs song URLs using djId values during gameplay.

2. JSON Driver Files

The app relies on two primary JSON files to drive its logic: djSongs.json and ArtistMaster.json. These files provide the necessary metadata for songs and artists.

2.1 djSongs.json

This file contains the metadata for all songs available in the game.

Example Structure

{
"songs": [
{
"id": "12345",
"title": "La Cumparsita",
"album": "The Best of Tango",
"artist": "Carlos Gardel",
"genre": "Tango",
"ArtistMaster": "Carlos Gardel",
"audioUrl": "https://namethattangotune.blob.core.windows.net/djsongs/12345.mp3"
},
{
"id": "67890",
"title": "El Choclo",
"album": "Tango Classics",
"artist": "Juan D'Arienzo",
"genre": "Milonga",
"ArtistMaster": "Juan D'Arienzo",
"audioUrl": "https://namethattangotune.blob.core.windows.net/djsongs/67890.mp3"
}
]
}

Key Fields 1. id: Unique identifier for the song (used as the file name in the blob storage). 2. title: The original title of the song. 3. album: The album where the song is featured. 4. artist: The original artist name as provided in the source data. 5. genre: The musical genre (e.g., Tango, Milonga, Vals). 6. ArtistMaster: A cleaned-up version of the artist’s name (used for matching with ArtistMaster.json). 7. audioUrl: The full URL to the song file in cloud storage (optional; dynamically constructed if missing).

Usage
• The app filters songs based on:
• Valid genre (e.g., Tango, Milonga, Vals).
• Non-empty ArtistMaster field.
• This file provides the primary song metadata used in the quiz.

2.2 ArtistMaster.json

This file lists all valid artists, their levels, and their activity status.

Example Structure

[
{
"artist": "Carlos Gardel",
"level": "1",
"active": "true"
},
{
"artist": "Juan D'Arienzo",
"level": "2",
"active": "true"
},
{
"artist": "Anibal Troilo",
"level": "3",
"active": "false"
}
]

Key Fields 1. artist: The name of the artist (used for matching with ArtistMaster in djSongs.json). 2. level: Indicates the priority or importance of the artist:
• Level 1: High-priority artists.
• Level 2: Medium-priority artists.
• Level 3: Low-priority artists (filtered out in the current logic). 3. active: Specifies whether the artist is currently active and valid for the game.

Usage
• The app filters artists to include only those:
• With level values of "1" or "2".
• Where active is "true".
• This ensures that only relevant artists are included in the distractors and correct answers.

3. Data Filtering and Integration

The app dynamically filters and combines data from djSongs.json and ArtistMaster.json to create a valid pool of songs and artists for gameplay.

Filtering Songs
• Valid songs must:
• Have a non-empty ArtistMaster field.
• Match an artist from ArtistMaster.json that satisfies:
• level of "1" or "2".
• active status of "true".

Constructing Song URLs
• If the audioUrl field is missing, the app constructs it dynamically:

song.audioUrl = `https://namethattangotune.blob.core.windows.net/djsongs/${song.id}.mp3`;

Distractors
• The app generates distractor options for the quiz by selecting random artists from the filtered ArtistMaster.json list.

4. Example Flow

   1. Fetch and Filter Data:
      • Load djSongs.json and ArtistMaster.json.
      • Filter valid songs and artists based on the rules described above.
   2. Game Logic:
      • Select a random song.
      • Start playback from a random position.
      • Generate multiple-choice options using the correct artist and distractors.
   3. Dynamic URL Construction:
      • Use the id field to fetch the correct song file from the blob storage.

5. Maintenance and Scalability
   • Adding Songs:
   • Add new entries to djSongs.json with the appropriate metadata.
   • Ensure the song file exists in the blob storage with a matching id.
   • Updating Artists:
   • Modify ArtistMaster.json to add or update artist levels and activity status.
   • Extensibility:
   • Add fields (e.g., regional metadata) to JSON files to enable future features, like filtering songs by region or era.

This system provides a scalable, structured way to manage songs and metadata, ensuring efficient integration with the app’s logic.
