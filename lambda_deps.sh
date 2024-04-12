#!/bin/bash

separator="--------------------------------------------------------------------------------------------------------------------------"


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


file_mod() {
    file="$1"
    status=$(git status --porcelain "$file" 2>/dev/null)
    if [ -n "$status" ]; then
        return 0  # File modified
    else
        return 1  # File not modified
    fi
}

default() {
    #activate_python_virtual_env
    find src -name "requirements.in" -type f | while read -r file; do
        echo "Requirements unchanged: $file"
        if file_mod "$file"; then
            echo "File modified: $file"
            echo "Updating requirements.txt"
            pip-compile -q --strip-extras "$file"
        fi
        # check if the generated requirements.txt is different from the one in git
        if file_mod "${file%.*}.txt"; then
            echo "File modified: ${file%.*}.txt"
            pip-sync -q "${file%.*}.txt"
        fi
    done
}



if [ $# -eq 0 ]; then
    default
    exit 0
fi

force_update() {
    # search for all requirements.txt files
    find src -name "requirements.in" -type f | while read -r file; do
        echo "Deleting requirements.txt for: $file"
        rm "${file%.*}.txt"
        echo "Updating requirements.txt"
        pip-compile -q --strip-extras "$file"
        echo "Installing requirements.txt"
        pip-sync -q "${file%.*}.txt"
    done
}




while getopts "fh" OPTION; do
    case $OPTION in
        f)
            force_update
            exit 0
            ;;
        h)
            echo "Usage: $0 [-f] [-h]"
            echo "  -f: Force update of requirements.txt"
            echo "  -h: Show this help message"
            exit 0
            ;;
        *)
            echo "Usage: $0 [-f] [-h]"
            echo "  -f: Force update of requirements.txt"
            echo "  -h: Show this help message"
            exit 1
            ;;
    esac
done