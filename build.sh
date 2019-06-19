#!/bin/bash

zipfile="js13k.zip"
buildpath="build"
jscat="min.js"
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
  cat "${file}" | sed 's/ 0,/,/g' | sed 's/, /,/g' | egrep -v '(name|type|visible|opacity|image|orientation|margin|spacing|version|rotation|draworder|renderorder|tilecount|columns|nextobjectid|firstgid|"id")' >> "${leveljs}"
  echo "," >> "${leveljs}"
done
echo "];" >> "${leveljs}"

# Concatenate the JS files
touch "${jscat}" >/dev/null 2>&1
for file in random.js timeline.js dtmf.js music.js font.js writer.js levels.js main.js
do
  yui-compressor "${file}" >> "${jscat}"
done

# Remove some fluff from the levels
sed -i "s/,width:0,/,/g" "${jscat}"
sed -i "s/,height:0,/,/g" "${jscat}"
sed -i "s/,width:64,/,/g" "${jscat}"
sed -i "s/,height:64,/,/g" "${jscat}"
sed -i "s/properties:{},//g" "${jscat}"

# Copy JS to build folder
cp "${jscat}" "${buildpath}"

# Add the index header
echo -n '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="Content-Type" content="text/html;charset=utf-8"/><title>Planet Figadore has gone OFFLINE</title><style>' > "${indexcat}"

# Concatenate the CSS files
for file in main.css tiles.css collect.css player.css enemy.css
do
  yui-compressor "${file}" >> "${indexcat}"
done

# Add on the rest of the index file
echo -n '</style><script type="text/javascript" src="min.js"></script><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/></head><body><div id="wrapper"><div id="background"></div><div id="playfield" level="0"></div><div id="player"></div></div><div id="ui"></div></body></html>' >> "${indexcat}"

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
