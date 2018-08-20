#!/bin/bash

zipfile="js13k.zip"
buildpath="build"
jscat="${buildpath}/min.js"
csscat="${buildpath}/min.css"
indexcat="${buildpath}/index.html"

# Create clean build folder
rm -Rf "${buildpath}" >/dev/null 2>&1
rm -Rf "${zipfile}"
mkdir "${buildpath}"

# Concatenate the JS files
touch "${jscat}"
for file in random.js dtmf.js font.js writer.js main.js
do
  yui-compressor "${file}" >> "${jscat}"
done

# Concatenate the CSS files
touch "${csscat}"
for file in main.css player.css enemy.css
do
  yui-compressor "${file}" >> "${csscat}"
done

# Copy in the index file
cp indexmin.html "${indexcat}"

# Zip everything up
zip -j ${zipfile} "${buildpath}"/*

# Determine file sizes and compression
unzip -lv "${zipfile}"
stat "${zipfile}"
