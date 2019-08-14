#!/bin/bash

cpath="closure"
dlname="compiler-latest.zip"

# Check if we need closure locally
if [ ! -d "${cpath}" ]
then
  mkdir "${cpath}" >/dev/null 2>&1
  cd "${cpath}"
  wget "https://dl.google.com/closure-compiler/${dlname}"
  unzip "${dlname}"
  rm "${dlname}"
  cd ..
fi

# Find out the latest jar filename
compiler=`ls -rt closure/closure-compiler-*.jar`

# Use first parameter as JS file, write to stdout with ADVANCED compilation level
java -jar "${compiler}" --compilation_level ADVANCED --js "$1"
