#!/bin/bash

activate_python_virtual_env() {
    # Activate the python virtual environment, if it exists
    # If it doesn't exist, create it
    if [[ -z "${VIRTUAL_ENV}" ]]; then
        echo "$separator"
        echo "Activating virtual environment"
        source .env/bin/activate 2>/dev/null || {
            echo "$separator"
            echo "Virtual environment not found. Creating one."
            python3.11 -m venv .env
            source .env/bin/activate
        }
    fi
}


create_layer() {
    # Create a lambda layer
    activate_python_virtual_env
    rm -rf layer_python
    echo "Creating lambda layer"
    find src -name "requirements.txt" -type f | while read -r file; do
        echo "Installing requirements.txt for: $file"
        mkdir -p layer_python
        python3.11 -m pip install -r $file -t layer_python
    done
    echo "Lambda layer created"
}

if [ $# -eq 0 ]; then
    create_layer
    exit 0
fi
