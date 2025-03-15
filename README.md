# Wix to WordPress Importer

This tool downloads blog posts from Wix site and allows them to be imported into WordPress using [WordPress Importer plugin](https://wordpress.org/plugins/wordpress-importer/). It handles posts and any images to import a clean post.

## Requirements

In order to import the media files and retain image links correctly into WordPress and retain the pathing correctly, you need to ensure `Organize my uploads into month- and year-based folders` in WordPress' `Settings` > `Media` is disabled.

## Running

Install external dependencies.

```bash
npm install
```

Create configuration and save .config.json

```json
{
  "source": "https://wixsitedomain.com",
  "destination": "https://wordpressdomain.com"
}
```

Optionally you can include a batchSize to chunk the output into different files:

```json
{
  "source": "https://wixsitedomain.com",
  "destination": "https://wordpressdomain.com",
  "batchSize": 25
}
```

Run the importer.

```bash
npm start
```
