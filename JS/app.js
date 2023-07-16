var firebaseConfig = {
    apiKey: "AIzaSyCOA_2bf_b1o1nXSHZO5Re5DjSD66Pa6MY",
    authDomain: "https://raona0-default-rtdb.firebaseio.com",
    projectId: "raona0",
    storageBucket: "raona0.appspot.com",
    messagingSenderId: "797719983777",
    appId: "1:797719983777:web:d7ffca1316891b51ec62e0"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to HTML elements
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const imageContainer = document.getElementById('imageContainer');
// Handle form submission
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent form submission

    const files = Array.from(fileInput.files); // Get the selected files as an array

    if (files.length > 0) {
        // Check if the user is authenticated
        const user = firebase.auth().currentUser;
        if (user) {
            files.forEach((file) => {
                // Create a storage reference with a unique filename based on the user's ID
                const storageRef = firebase.storage().ref().child(`${user.uid}/${Date.now()}_${file.name}`);

                // Upload file to Firebase Storage
                const uploadTask = storageRef.put(file);

                // Display Swal progress bar
                Swal.fire({
                    title: 'Uploading...',
                    html: '<div id="progressBar"></div>',
                    allowOutsideClick: false,
                    didOpen: () => {
                        const progressBar = Swal.getHtmlContainer().querySelector('#progressBar');
                        uploadTask.on('state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                progressBar.innerHTML = `Uploading: ${Math.round(progress)}%`;
                            },
                            (error) => {
                                Swal.fire('Error', `Failed to upload file: ${error.message}`, 'error');
                            },
                            () => {
                                uploadTask.snapshot.ref.getDownloadURL()
                                    .then((downloadURL) => {
                                        Swal.fire('Success', 'File uploaded successfully!', 'success');
                                        // Use the downloadURL as needed (e.g., display the image)
                                        console.log('Download URL:', downloadURL);
                                        // Add the image to the image container
                                        addImageToContainer(downloadURL);
                                    })
                                    .catch((error) => {
                                        Swal.fire('Error', `Failed to retrieve file URL: ${error.message}`, 'error');
                                    });
                            }
                        );
                    }
                });
            });
        } else {
            Swal.fire('Authentication Required', 'Please sign in to upload images.', 'warning');
        }
    }
});

// Function to add the image to the image container
function addImageToContainer(downloadURL) {
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');

    const skeletonLoading = document.createElement('div');
    skeletonLoading.classList.add('skeleton-loading');

    const imageElement = document.createElement('img');
    imageElement.src = downloadURL;
    imageElement.onload = () => {
        // Remove skeleton loading effect once the image is loaded
        skeletonLoading.remove();
        imageElement.style.display = 'block';
    };

    const optionsIcon = document.createElement('div');
    optionsIcon.classList.add('options-icon');
    optionsIcon.innerHTML = '⋮';
    optionsIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOptionsMenu(optionsMenu);
    });

    const optionsMenu = document.createElement('div');
    optionsMenu.classList.add('options-menu');

    const viewOption = createOption('👁‍🗨 View', () => {
        viewImage(downloadURL);
    });
    const deleteOption = createOption('❌ Delete', () => {
        deleteImage(imageContainer, downloadURL);
    });

    optionsMenu.appendChild(viewOption);
    optionsMenu.appendChild(deleteOption);

    imageContainer.appendChild(skeletonLoading);
    imageContainer.appendChild(imageElement);
    imageContainer.appendChild(optionsIcon);
    imageContainer.appendChild(optionsMenu);

    document.getElementById('imageContainer').appendChild(imageContainer);
}


// Function to create an option element
function createOption(label, action) {
    const option = document.createElement('div');
    option.classList.add('option');
    option.textContent = label;
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        action();
    });
    return option;
}


// Function to toggle the options menu
function toggleOptionsMenu(optionsMenu) {
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
}

// Add click event listener to each options icon
const optionsIcons = document.getElementsByClassName('options-icon');
for (let i = 0; i < optionsIcons.length; i++) {
    optionsIcons[i].addEventListener('click', (e) => {
        e.stopPropagation();
        const optionsMenu = optionsIcons[i].nextElementSibling;
        toggleOptionsMenu(optionsMenu);
    });
}

// Function to view the image
function viewImage(downloadURL) {
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const closeButton = document.createElement('span');
    closeButton.classList.add('modal-close');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    const image = document.createElement('img');
    image.classList.add('modal-image');
    image.src = downloadURL;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(image);
    modal.appendChild(modalContent);

    // Hide options menu
    const optionsMenus = document.getElementsByClassName('options-menu');
    for (let i = 0; i < optionsMenus.length; i++) {
        optionsMenus[i].style.display = 'none';
    }

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Enable zoom functionality using medium-zoom
    mediumZoom(image, {
        margin: 24,
        background: 'rgba(0, 0, 0, 0.9)'
    });

    // Handle escape key press to close the fullscreen popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.remove();
        }
    });
}
// Function to delete the image
function deleteImage(imageContainer, downloadURL) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Delete the image from Firebase Storage
            const imageRef = firebase.storage().refFromURL(downloadURL);
            imageRef.delete()
                .then(() => {
                    // Remove the image container from the DOM
                    imageContainer.remove();
                    Swal.fire('Deleted!', 'The image has been deleted.', 'success');
                })
                .catch((error) => {
                    Swal.fire('Error', `Failed to delete the image: ${error.message}`, 'error');
                });
        }
    });
}

// Fetch and display the authenticated user's uploaded images during page load
window.addEventListener('load', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const storageRef = firebase.storage().ref(user.uid);

            // List all the items in the user's storage bucket
            storageRef.listAll()
                .then((res) => {
                    res.items.forEach((itemRef) => {
                        itemRef.getDownloadURL()
                            .then((downloadURL) => {
                                addImageToContainer(downloadURL);
                            })
                            .catch((error) => {
                                console.log('Failed to retrieve file URL:', error);
                            });
                    });
                })
                .catch((error) => {
                    console.log('Failed to list items in storage:', error);
                });
        }
    });
});