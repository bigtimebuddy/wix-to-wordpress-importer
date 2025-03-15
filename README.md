# Wix to WordPress Importer

This tool downloads blog posts from Wix site and saves them as WordPress eXtended RSS XML format. This allows them to be imported into WordPress using [WordPress Importer plugin](https://wordpress.org/plugins/wordpress-importer/). It handles posts and any images to import a clean post.

## Requirements

In order to import the media files and retain image links correctly into WordPress and retain the pathing correctly, you need to ensure `Organize my uploads into month- and year-based folders` in WordPress' `Settings` > `Media` is disabled.

## Running

Install external dependencies.

```bash
npm install -g wix-to-wordpress-importer
```

Create configuration and save to JSON file

```json
{
  "source": "https://wixsitedomain.com",
  "destination": "https://wordpressdomain.com"
}
```

If you're WordPress site is on a shared host, there can be timeouts imposed for the import actions as they are blocking on the server-side. In this case, it's better to batch your posts into separate files that you can import one at a time. For this case you can specify a `batchSize`. This is the number of posts that will be contained in an output WXR file.

```json
{
  "source": "https://wixsitedomain.com",
  "destination": "https://wordpressdomain.com",
  "batchSize": 25
}
```

Run the importer.

```bash
wix-to-wordpress-importer -c config.json
```
