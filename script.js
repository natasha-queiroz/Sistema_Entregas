document.addEventListener('DOMContentLoaded', () => {
    // --- Mock Data & State ---
    const initialUsers = {
        'motoboy1': 'senha123',
        'motoboy2': 'senha456',
        'admin': 'admin123'
    };
    let users = JSON.parse(localStorage.getItem('users')) || initialUsers;
    let currentUser = null;
    let deliveries = JSON.parse(localStorage.getItem('deliveries')) || [];

    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const historyScreen = document.getElementById('history-screen');
    
    // Login form
    const loginContainer = document.querySelector('.login-container');
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');
    const showRegisterLink = document.getElementById('show-register');

    // Register form
    const registerContainer = document.getElementById('register-container');
    const registerButton = document.getElementById('register-button');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const registerError = document.getElementById('register-error');
    const showLoginLink = document.getElementById('show-login');

    // App screen
    const logoutButton = document.getElementById('logout-button');
    const driverNameSpan = document.getElementById('driver-name');
    const viewHistoryButton = document.getElementById('view-history-button');
    
    const deliveryForm = document.getElementById('delivery-form');
    const registerDeliveryButton = document.getElementById('register-delivery-button');
    const companyTypeSelect = document.getElementById('company-type');
    const deliveryStatusSelect = document.getElementById('delivery-status');
    const notesTextarea = document.getElementById('notes');
    const registrationError = document.getElementById('registration-error');
    
    // History screen
    const backToAppButton = document.getElementById('back-to-app-button');
    const logoutButtonHistory = document.getElementById('logout-button-history');
    const historyContainer = document.getElementById('delivery-history');
    const filterStatus = document.getElementById('filter-status');
    const filterCompany = document.getElementById('filter-company');
    const filterDriver = document.getElementById('filter-driver');

    // --- Functions ---

    const saveUsers = () => {
        localStorage.setItem('users', JSON.stringify(users));
    };

    const saveDeliveries = () => {
        localStorage.setItem('deliveries', JSON.stringify(deliveries));
    };

    const renderDeliveries = () => {
        const statusFilter = filterStatus.value;
        const companyFilter = filterCompany.value;
        const driverFilter = filterDriver.value;

        const filteredDeliveries = deliveries.filter(d => {
            const statusMatch = statusFilter === 'all' || d.status === statusFilter;
            const companyMatch = companyFilter === 'all' || d.companyType === companyFilter;
            const driverMatch = driverFilter === 'all' || d.driver === driverFilter;
            return statusMatch && companyMatch && driverMatch;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent

        historyContainer.innerHTML = '';

        if (filteredDeliveries.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">Nenhuma entrega encontrada.</p>';
            return;
        }

        filteredDeliveries.forEach(delivery => {
            const item = document.createElement('div');
            const statusClass = delivery.status.replace(/\s+/g, '-').toLowerCase();
            item.className = `delivery-item status-${statusClass}`;
            
            const localDateTime = new Date(delivery.timestamp).toLocaleString('pt-BR');

            item.innerHTML = `
                <div class="item-header">
                    <strong>${delivery.companyType} - ${delivery.status}</strong>
                    <span class="timestamp">${localDateTime}</span>
                </div>
                <div class="item-body">
                    <p><strong>Entregador:</strong> ${delivery.driver}</p>
                    <p><strong>Localização:</strong> <a href="https://www.google.com/maps?q=${delivery.location.latitude},${delivery.location.longitude}" target="_blank">Ver no mapa</a></p>
                    ${delivery.notes ? `<p class="notes"><strong>Obs:</strong> ${delivery.notes}</p>` : ''}
                </div>
            `;
            historyContainer.appendChild(item);
        });
    };
    
    const populateDriverFilter = () => {
        const uniqueDrivers = [...new Set(deliveries.map(d => d.driver))];
        filterDriver.innerHTML = '<option value="all">Todos</option>';
        uniqueDrivers.forEach(driver => {
           const option = document.createElement('option');
           option.value = driver;
           option.textContent = driver;
           filterDriver.appendChild(option);
        });
    };

    const showScreen = (screen) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    };

    const showLoginMessage = (message, type = 'error') => {
        loginMessage.textContent = message;
        loginMessage.className = type; // 'success' or 'error'
    };

    const clearLoginMessages = () => {
        loginMessage.textContent = '';
        loginMessage.className = '';
        registerError.textContent = '';
    };

    const login = (username, password) => {
        if (users[username] && users[username] === password) {
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            driverNameSpan.textContent = currentUser;
            clearLoginMessages();
            usernameInput.value = '';
            passwordInput.value = '';
            showScreen(appScreen);
            populateDriverFilter();
            renderDeliveries();
        } else {
            showLoginMessage('Usuário ou senha inválidos.', 'error');
        }
    };

    const logout = () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        passwordInput.value = '';
        showScreen(loginScreen);
        // Ensure only login form is visible on logout
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        clearLoginMessages();
    };

    const getGeoLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não é suportada pelo seu navegador.'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    () => {
                        reject(new Error('Não foi possível obter a localização. Verifique as permissões.'));
                    }
                );
            }
        });
    };
    
    const handleUserRegistration = () => {
        const username = newUsernameInput.value.trim();
        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        registerError.textContent = '';

        if (!username || !password || !confirmPassword) {
            registerError.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        if (password !== confirmPassword) {
            registerError.textContent = 'As senhas não coincidem.';
            return;
        }
        if (users[username]) {
            registerError.textContent = 'Este nome de usuário já existe.';
            return;
        }

        // Add new user
        users[username] = password;
        saveUsers();
        
        // Clear registration form
        newUsernameInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        // Show login screen with success message
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        showLoginMessage('Cadastro realizado com sucesso! Faça o login para continuar.', 'success');
    };

    const handleDeliveryRegistration = async (e) => {
        e.preventDefault();
        registrationError.textContent = '';
        const buttonText = registerDeliveryButton.querySelector('.button-text');
        const loader = registerDeliveryButton.querySelector('.loader');

        buttonText.style.display = 'none';
        loader.style.display = 'inline-block';
        registerDeliveryButton.disabled = true;

        try {
            const location = await getGeoLocation();
            
            const newDelivery = {
                id: Date.now(),
                driver: currentUser,
                timestamp: new Date().toISOString(),
                companyType: companyTypeSelect.value,
                status: deliveryStatusSelect.value,
                notes: notesTextarea.value.trim(),
                location: location
            };

            deliveries.push(newDelivery);
            saveDeliveries();
            renderDeliveries();
            populateDriverFilter();
            deliveryForm.reset();

        } catch (error) {
            registrationError.textContent = error.message;
        } finally {
            buttonText.style.display = 'inline-block';
            loader.style.display = 'none';
            registerDeliveryButton.disabled = false;
        }
    };


    // --- Event Listeners ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearLoginMessages();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        clearLoginMessages();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    loginButton.addEventListener('click', () => {
        login(usernameInput.value, passwordInput.value);
    });
    
    // Allow login with Enter key
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            login(usernameInput.value, passwordInput.value);
        }
    });

    registerButton.addEventListener('click', handleUserRegistration);
    confirmPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserRegistration();
        }
    });

    logoutButton.addEventListener('click', logout);
    logoutButtonHistory.addEventListener('click', logout);
    deliveryForm.addEventListener('submit', handleDeliveryRegistration);

    viewHistoryButton.addEventListener('click', () => {
        renderDeliveries(); // Refresh history when viewing
        showScreen(historyScreen);
    });

    backToAppButton.addEventListener('click', () => {
        showScreen(appScreen);
    });

    [filterStatus, filterCompany, filterDriver].forEach(filter => {
        filter.addEventListener('change', renderDeliveries);
    });

    // --- Initialization ---
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && users[storedUser]) {
        currentUser = storedUser;
        driverNameSpan.textContent = currentUser;
        showScreen(appScreen);
        populateDriverFilter();
        renderDeliveries();
    } else {
        showScreen(loginScreen);
        clearLoginMessages();
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
    }
});