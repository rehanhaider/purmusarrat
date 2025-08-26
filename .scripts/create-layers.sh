#!/bin/bash
shopt -s expand_aliases
alias echo="echo -e"

# Layers directory
LAYERS_DIR=.layers
# Main requirements file
MAIN_REQUIREMENTS_FILE=requirements.txt
# Common requirements file
COMMON_REQUIREMENTS_FILE=aws/requirements.txt
COMMON_OUTPUT_DIR=${LAYERS_DIR}/common/python

SHARED_LIB_CODE_DIR=aws/src/stacks/shared

# Create the layers directory
rm -rf ${LAYERS_DIR}
mkdir -p ${LAYERS_DIR}

# Create the output directories
mkdir -p ${COMMON_OUTPUT_DIR}

# Download the dependencies for layers
python -m pip install -r ${COMMON_REQUIREMENTS_FILE} --target ${COMMON_OUTPUT_DIR} --upgrade

# Install all the dependencies for offline development users
echo "Installing dependencies in virtual environment"
python -m pip install -r ${MAIN_REQUIREMENTS_FILE} --upgrade



## Libs

# SHARED_LIB_OUTPUT_DIR_NAME=shared

# mkdir -p ${COMMON_OUTPUT_DIR}/${SHARED_LIB_OUTPUT_DIR_NAME}

# Copy the shared lib code
cp -r ${SHARED_LIB_CODE_DIR} ${COMMON_OUTPUT_DIR}/
