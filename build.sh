#!/bin/bash

zipfile="js13k.zip"
buildpath="build"
jscat="${buildpath}/min.js"
csscat="${buildpath}/min.css"
indexcat="${buildpath}/index.html"
leveljs="levels.js"

# Create clean build folder
rm -Rf "${buildpath}" >/dev/null 2>&1
rm -Rf "${zipfile}"
mkdir "${buildpath}"

# Concatenate the JSON level files
echo "var levels=[" > "${leveljs}"
for file in level*.json
do
  cat "${file}" | sed 's/ 0,/,/g' | egrep -v "(name|type|visible|opacity|image|orientation|margin|spacing|version)" >> "${leveljs}"
  echo "," >> "${leveljs}"
done
echo "];" >> "${leveljs}"

# Concatenate the JS files
touch "${jscat}"
for file in random.js timeline.js dtmf.js music.js font.js writer.js levels.js main.js
do
  yui-compressor "${file}" >> "${jscat}"
done

# Remove some fluff from the levels
sed -i "s/,height:0,properties:{},width:0,/,/g" "${jscat}"
sed -i "s/,height:64,properties:{},width:64,/,/g" "${jscat}"

# Concatenate the CSS files
touch "${csscat}"
for file in main.css tiles.css collect.css player.css enemy.css
do
  yui-compressor "${file}" >> "${csscat}"
done

# Copy in the index file
cp indexmin.html "${indexcat}"

# Zip everything up
zip -j "${zipfile}" "${buildpath}"/*

# Save about 1k more with advzip
advzip -z -4 "${zipfile}"

# Determine file sizes and compression
unzip -lv "${zipfile}"
stat "${zipfile}"

echo "Manual step now required to comply with 13k limit"
echo "Use Google Closure compiler in advanced mode on build/min.js"
echo "https://closure-compiler.appspot.com/home"
