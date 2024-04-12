#!/bin/bash

separator="--------------------------------------------------------------------------------------------------------------------------"


install_npm() {
    echo "$separator"
    echo "Checking if npm is installed"
    echo "$separator"
    if command -v npm &>/dev/null; then
        echo "npm is already installed."
        echo "$separator"
    else
        echo "npm is not installed."
        echo "$separator"
        echo "Installing npm"
        sudo apt-get install curl -y
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
        if command -v npm &>/dev/null; then
            echo "npm installed successfully."
            echo "$separator"
        else
            echo "npm installation failed. Please install npm manually. Exiting..."
            echo "$separator"
            exit 1
        fi
    fi
}

install_nodejs() {
    echo "$separator"
    echo "Checking if Node.js is installed"
    echo "$separator"
    if command -v node &>/dev/null; then
        echo "Node.js is already installed."
    else
        echo "Node.js is not installed."
        echo "$separator"
        echo "Installing Node.js"
        nvm install --lts
        if command -v node &>/dev/null; then
            echo "Node.js installed successfully."
            echo "$separator"
        else
            echo "Node.js installation failed. Please install Node.js manually. Exiting..."
            echo "$separator"
            exit 1
        fi
    fi
}


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
            echo "Virtual environment created and activated"
        }
    else
        echo "$separator"
        echo "Virtual environment already activated"
        echo "$separator"
    fi
}


install_python_requirements() {
    echo "$separator"
    echo "Project specific requirements"
    echo "$separator"
    pip install -r requirements.txt | grep -v 'Requirement already satisfied'

    # Fetch all the requirements.txt files
    readarray -t requirements < <(find ./src -name "requirements.txt")

    # loop through the array and install the requirements
    for requirement in "${requirements[@]}"
    do
        echo "$separator"
        echo "Installing lambda requirements for $requirement"
        pip install -r $requirement | grep -v 'Requirement already satisfied'
        echo "$separator"
    done
}


execute_all() {
    install_npm
    install_nodejs
    activate_python_virtual_env
    install_python_requirements
}

if [ $# -eq 0 ]; then
    execute_all
    exit 0
fi

while getopts "napeh" OPTION; do
    case $OPTION in
        n)
            install_npm
            ;;
        a)
            activate_python_virtual_env
            ;;
        p)
            install_python_requirements
            ;;
        e)
            install_nodejs
            ;;
        h)
            echo "Usage: script.sh [options]"
            echo "Options:"
            echo "  -n  Install npm"
            echo "  -a  Activate Python virtual environment"
            echo "  -p  Install Python requirements"
            echo "  -e  Install Node.js"
            echo "  -h  Display this help message"
            exit 0
            ;;
        *)
            echo "Invalid option. Use -h for help."
            exit 1
            ;;
    esac
done