/* =========================================
   NIGHTCALL - JAVASCRIPT
========================================= */

"use strict";


/* =========================================
   ELEMENTOS PRINCIPAIS
========================================= */

const sidebarLinks =
    document.querySelectorAll(".sidebar-link");

const navButtons =
    document.querySelectorAll(".nav-button");

const profileButtons =
    document.querySelectorAll(".profile-actions button");


const homePage =
    document.getElementById("homePage");

const friendsPage =
    document.getElementById("friendsPage");

const messagesPage =
    document.getElementById("messagesPage");


const addMessageButton =
    document.querySelector(".add-message");


/* =========================================
   USUÁRIO
========================================= */

let currentUser = {

    name: "Usuário",

    username: "@usuario",

    avatar: ""

};


/* =========================================
   DADOS
========================================= */

let friends = [];

let friendRequests = [];

let conversations = [];


/* =========================================
   ESTADO
========================================= */

const appState = {

    currentPage: "home",

    microphoneEnabled: false,

    headphonesEnabled: false,

    onlineUsers: []

};


/* =========================================
   STORAGE
========================================= */

function readStorage(key, fallback) {

    try {

        const saved =
            localStorage.getItem(key);


        if (!saved) {

            return fallback;

        }


        const parsed =
            JSON.parse(saved);


        if (
            fallback &&
            typeof fallback === "object" &&
            !Array.isArray(fallback)
        ) {

            return {

                ...fallback,

                ...parsed

            };

        }


        return parsed;

    }

    catch (error) {

        console.warn(
            "Erro ao ler localStorage:",
            error
        );

        return fallback;

    }

}


function writeStorage(key, value) {

    try {

        localStorage.setItem(

            key,

            JSON.stringify(value)

        );

    }

    catch (error) {

        console.warn(
            "Erro ao salvar localStorage:",
            error
        );

    }

}


/* =========================================
   USUÁRIO
========================================= */

function loadCurrentUser() {

    const saved =
        readStorage(
            "nightcallProfile",
            null
        );


    if (saved) {

        currentUser = {

            name:
                saved.name ||
                "Usuário",


            username:
                "@" +
                String(
                    saved.username ||
                    "usuario"
                ).replace(/^@/, ""),


            avatar:
                saved.avatar ||
                ""

        };

    }


    const myName =
        document.getElementById("myName");


    const myUsername =
        document.getElementById("myUsername");


    const myAvatar =
        document.getElementById("myAvatar");


    if (myName) {

        myName.textContent =
            currentUser.name;

    }


    if (myUsername) {

        myUsername.textContent =
            currentUser.username;

    }


    if (myAvatar) {

        if (currentUser.avatar) {

            myAvatar.src =
                currentUser.avatar;

            myAvatar.style.display =
                "block";

        }

        else {

            myAvatar.removeAttribute(
                "src"
            );

        }

    }

}


/* =========================================
   BOAS-VINDAS
========================================= */

function updateWelcomeMessage() {

    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );


    if (!welcomeMessage) {

        return;

    }


    const hour =
        new Date().getHours();


    let greeting =
        "Boa noite";


    if (
        hour >= 5 &&
        hour < 12
    ) {

        greeting =
            "Bom dia";

    }

    else if (
        hour >= 12 &&
        hour < 18
    ) {

        greeting =
            "Boa tarde";

    }


    if (
        !currentUser.name ||
        currentUser.name === "Usuário"
    ) {

        welcomeMessage.textContent =
            `${greeting}.`;

    }

    else {

        welcomeMessage.textContent =
            `${greeting}, ${currentUser.name}.`;

    }

}


/* =========================================
   PÁGINAS
========================================= */

function setCurrentPage(page) {

    appState.currentPage =
        page;

}


function showPage(page) {

    const pages = [

        homePage,

        friendsPage,

        messagesPage

    ];


    pages.forEach(

        function(pageElement) {

            if (pageElement) {

                pageElement.classList.remove(
                    "active-page"
                );

            }

        }

    );


    if (
        page === "home" &&
        homePage
    ) {

        homePage.classList.add(
            "active-page"
        );

    }


    if (
        page === "friends" &&
        friendsPage
    ) {

        friendsPage.classList.add(
            "active-page"
        );

    }


    if (
        page === "messages" &&
        messagesPage
    ) {

        messagesPage.classList.add(
            "active-page"
        );

    }


    setCurrentPage(page);

    updateActiveNavigation();

}


/* =========================================
   SIDEBAR
========================================= */

function activateSidebarItem(section) {

    sidebarLinks.forEach(

        function(link) {

            const text =
                link
                    .querySelector(
                        "span:last-child"
                    )
                    ?.textContent
                    .trim();


            link.classList.toggle(

                "active",

                text === section

            );

        }

    );

}


sidebarLinks.forEach(

    function(link) {

        link.addEventListener(

            "click",

            function(event) {

                event.preventDefault();


                const section =
                    link
                        .querySelector(
                            "span:last-child"
                        )
                        ?.textContent
                        .trim();


                if (section === "Início") {

                    showHome();

                }


                if (section === "Amigos") {

                    showFriends();

                }

            }

        );

    }

);


/* =========================================
   INÍCIO
========================================= */

function showHome() {

    showPage("home");

    activateSidebarItem(
        "Início"
    );

}


/* =========================================
   AMIGOS
========================================= */

function showFriends() {

    showPage("friends");

    activateSidebarItem(
        "Amigos"
    );

    renderFriends();

}


/* =========================================
   MENSAGENS
========================================= */

function showMessages() {

    showPage("messages");

    renderConversations();

}


/* =========================================
   NAVEGAÇÃO PRINCIPAL
========================================= */

navButtons.forEach(

    function(button) {

        button.addEventListener(

            "click",

            function(event) {

                event.preventDefault();


                if (
                    button.classList.contains(
                        "add-button"
                    )
                ) {

                    openAddMenu();

                    return;

                }


                if (
                    button.title ===
                    "Início"
                ) {

                    showHome();

                    return;

                }


                if (
                    button.title ===
                    "Mensagens"
                ) {

                    showMessages();

                }

            }

        );

    }

);


/* =========================================
   ATIVAÇÃO DOS BOTÕES
========================================= */

function updateActiveNavigation() {

    navButtons.forEach(

        function(button) {

            button.classList.remove(
                "active"
            );

        }

    );


    if (
        appState.currentPage ===
        "home"
    ) {

        document
            .querySelector(
                '.nav-button[title="Início"]'
            )
            ?.classList.add(
                "active"
            );

    }


    if (
        appState.currentPage ===
        "messages"
    ) {

        document
            .querySelector(
                '.nav-button[title="Mensagens"]'
            )
            ?.classList.add(
                "active"
            );

    }

}


/* =========================================
   BOTÃO +
========================================= */

function openAddMenu() {

    console.log(
        "Menu de adicionar aberto."
    );

}


/* =========================================
   MICROFONE
========================================= */

function toggleMicrophone() {

    appState.microphoneEnabled =
        !appState.microphoneEnabled;


    console.log(

        appState.microphoneEnabled

            ? "Microfone ativado."

            : "Microfone desativado."

    );

}


/* =========================================
   FONES
========================================= */

function toggleHeadphones() {

    appState.headphonesEnabled =
        !appState.headphonesEnabled;


    console.log(

        appState.headphonesEnabled

            ? "Fones ativados."

            : "Fones desativados."

    );

}


/* =========================================
   PERFIL
========================================= */

profileButtons.forEach(

    function(button, index) {

        button.addEventListener(

            "click",

            function() {

                if (index === 0) {

                    toggleMicrophone();

                }

                else if (index === 1) {

                    toggleHeadphones();

                }

                else if (index === 2) {

                    openSettings();

                }

            }

        );

    }

);


/* =========================================
   CONFIGURAÇÕES
========================================= */

function openSettings(section = "profile") {

    const overlay =
        document.getElementById(
            "settingsOverlay"
        );


    if (!overlay) {

        console.error(
            "settingsOverlay não encontrado no HTML."
        );

        return;

    }


    overlay.classList.add(
        "open"
    );


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "settings-open"
    );


    if (
        typeof openSection ===
        "function"
    ) {

        openSection(section);

    }

}


/* =========================================
   FECHAR CONFIGURAÇÕES
   SOMENTE PELO BOTÃO
   "VOLTAR PARA O NIGHTCALL"
========================================= */

function closeSettings() {

    const overlay =
        document.getElementById(
            "settingsOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "open"
    );


    overlay.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "settings-open"
    );

}


/* =========================================
   BOTÃO VOLTAR PARA O NIGHTCALL
========================================= */

const closeSettingsButton =
    document.getElementById(
        "closeSettingsButton"
    );


if (closeSettingsButton) {

    closeSettingsButton.addEventListener(

        "click",

        closeSettings

    );

}


/* =========================================
   PERFIL SALVO
========================================= */

document.addEventListener(

    "nightcallProfileSaved",

    function() {

        loadCurrentUser();

        updateWelcomeMessage();

        updateSettingsMiniProfile();

    }

);


/* =========================================
   MINI PERFIL DAS CONFIGURAÇÕES
========================================= */

function updateSettingsMiniProfile() {

    const miniName =
        document.getElementById(
            "settingsMiniName"
        );


    const miniAvatar =
        document.getElementById(
            "settingsMiniAvatar"
        );


    if (miniName) {

        miniName.textContent =
            currentUser.name ||
            "Usuário";

    }


    if (!miniAvatar) {

        return;

    }


    miniAvatar.innerHTML =
        "";


    if (currentUser.avatar) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            currentUser.avatar;


        image.alt =
            "";


        miniAvatar.appendChild(
            image
        );

    }

    else {

        miniAvatar.textContent =
            "👤";

    }

}


/* =========================================
   ONLINE
========================================= */

function updateOnlineCount() {

    const onlineCount =
        document.getElementById(
            "onlineCount"
        );


    if (!onlineCount) {

        return;

    }


    const total =
        appState.onlineUsers.length;


    if (total === 0) {

        onlineCount.textContent =
            "0 pessoas online";

    }

    else if (total === 1) {

        onlineCount.textContent =
            "1 pessoa online";

    }

    else {

        onlineCount.textContent =
            `${total} pessoas online`;

    }

}


/* =========================================
   AMIGOS
========================================= */

const friendsList =
    document.getElementById(
        "friendsList"
    );


const friendsEmpty =
    document.getElementById(
        "friendsEmpty"
    );


const friendsTotal =
    document.getElementById(
        "friendsTotal"
    );


const friendsListTitle =
    document.getElementById(
        "friendsListTitle"
    );


const friendSearch =
    document.getElementById(
        "friendSearch"
    );


const addFriendButton =
    document.getElementById(
        "addFriendButton"
    );


const emptyAddFriend =
    document.getElementById(
        "emptyAddFriend"
    );


const friendsTabs =
    document.querySelectorAll(
        ".friends-tab"
    );


const requestCount =
    document.querySelector(
        ".request-count"
    );


let currentFriendsTab =
    "all";


/* =========================================
   RENDERIZAR AMIGOS
========================================= */

function renderFriends() {

    if (!friendsList) {

        return;

    }


    friendsList.innerHTML =
        "";


    let filteredFriends =
        [...friends];


    if (
        currentFriendsTab ===
        "online"
    ) {

        filteredFriends =
            filteredFriends.filter(

                function(friend) {

                    return (
                        friend.online ===
                        true
                    );

                }

            );

    }


    if (
        currentFriendsTab ===
        "pending"
    ) {

        filteredFriends =
            [...friendRequests];

    }


    const search =
        friendSearch
            ?.value
            .trim()
            .toLowerCase();


    if (search) {

        filteredFriends =
            filteredFriends.filter(

                function(friend) {

                    const name =
                        String(
                            friend.name ||
                            ""
                        ).toLowerCase();


                    const username =
                        String(
                            friend.username ||
                            ""
                        ).toLowerCase();


                    return (

                        name.includes(
                            search
                        ) ||

                        username.includes(
                            search
                        )

                    );

                }

            );

    }


    if (friendsTotal) {

        const total =
            filteredFriends.length;


        friendsTotal.textContent =

            total === 1

                ? "1 amigo"

                : `${total} amigos`;

    }


    if (
        filteredFriends.length ===
        0
    ) {

        friendsEmpty?.classList.add(
            "visible"
        );

        return;

    }


    friendsEmpty?.classList.remove(
        "visible"
    );


    filteredFriends.forEach(

        function(friend) {

            friendsList.appendChild(

                createFriendCard(
                    friend
                )

            );

        }

    );

}


/* =========================================
   CARD DE AMIGO
========================================= */

function createFriendCard(friend) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "friend-card";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "friend-avatar";


    if (friend.avatar) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            friend.avatar;


        image.alt =
            "Foto de " +
            (
                friend.name ||
                "usuário"
            );


        avatar.appendChild(
            image
        );

    }

    else {

        const placeholder =
            document.createElement(
                "span"
            );


        placeholder.className =
            "friend-avatar-placeholder";


        placeholder.textContent =
            "👤";


        avatar.appendChild(
            placeholder
        );

    }


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "friend-status";


    if (friend.online) {

        status.classList.add(
            "online"
        );

    }


    avatar.appendChild(
        status
    );


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "friend-info";


    const name =
        document.createElement(
            "strong"
        );


    name.className =
        "friend-name";


    name.textContent =
        friend.name ||
        "Usuário";


    const username =
        document.createElement(
            "span"
        );


    username.className =
        "friend-username";


    username.textContent =
        friend.username ||
        "@usuario";


    info.appendChild(
        name
    );


    info.appendChild(
        username
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "friend-actions";


    const message =
        document.createElement(
            "button"
        );


    message.type =
        "button";


    message.className =
        "friend-action";


    message.title =
        "Enviar mensagem";


    message.textContent =
        "💬";


    message.addEventListener(

        "click",

        function() {

            openConversation(
                friend
            );

        }

    );


    const more =
        document.createElement(
            "button"
        );


    more.type =
        "button";


    more.className =
        "friend-action";


    more.title =
        "Mais opções";


    more.textContent =
        "⋯";


    more.addEventListener(

        "click",

        function() {

            openFriendOptions(
                friend
            );

        }

    );


    actions.appendChild(
        message
    );


    actions.appendChild(
        more
    );


    card.appendChild(
        avatar
    );


    card.appendChild(
        info
    );


    card.appendChild(
        actions
    );


    return card;

}


/* =========================================
   PESQUISA DE AMIGOS
========================================= */

if (friendSearch) {

    friendSearch.addEventListener(

        "input",

        renderFriends

    );

}


/* =========================================
   ABAS DE AMIGOS
========================================= */

friendsTabs.forEach(

    function(tab) {

        tab.addEventListener(

            "click",

            function() {

                friendsTabs.forEach(

                    function(item) {

                        item.classList.remove(
                            "active"
                        );

                    }

                );


                tab.classList.add(
                    "active"
                );


                currentFriendsTab =
                    tab.dataset.tab;


                if (friendsListTitle) {

                    if (
                        currentFriendsTab ===
                        "all"
                    ) {

                        friendsListTitle.textContent =
                            "Todos os amigos";

                    }

                    else if (
                        currentFriendsTab ===
                        "online"
                    ) {

                        friendsListTitle.textContent =
                            "Amigos online";

                    }

                    else {

                        friendsListTitle.textContent =
                            "Solicitações de amizade";

                    }

                }


                renderFriends();

            }

        );

    }

);


/* =========================================
   OPÇÕES DO AMIGO
========================================= */

function openFriendOptions(friend) {

    console.log(

        "Opções de " +
        (
            friend.name ||
            "usuário"
        )

    );

}


/* =========================================
   CONTADOR DE SOLICITAÇÕES
========================================= */

function updateFriendRequestCount() {

    if (!requestCount) {

        return;

    }


    const total =
        friendRequests.length;


    requestCount.textContent =
        total;


    requestCount.style.display =

        total > 0

            ? "inline-flex"

            : "none";

}


/* =========================================
   ADICIONAR AMIGO
========================================= */

if (addFriendButton) {

    addFriendButton.addEventListener(

        "click",

        openAddFriend

    );

}


if (emptyAddFriend) {

    emptyAddFriend.addEventListener(

        "click",

        openAddFriend

    );

}


/* =========================================
   ELEMENTOS DO MODAL DE AMIGO
========================================= */

const addFriendModal =
    document.getElementById(
        "addFriendModal"
    );


const addFriendUsername =
    document.getElementById(
        "addFriendUsername"
    );


const addFriendError =
    document.getElementById(
        "addFriendError"
    );


const addFriendResult =
    document.getElementById(
        "addFriendResult"
    );


const resultUserName =
    document.getElementById(
        "resultUserName"
    );


const resultUserUsername =
    document.getElementById(
        "resultUserUsername"
    );


const sendFriendRequest =
    document.getElementById(
        "sendFriendRequest"
    );


const searchFriendButton =
    document.getElementById(
        "searchFriendButton"
    );


const closeAddFriendModal =
    document.getElementById(
        "closeAddFriendModal"
    );


const cancelAddFriend =
    document.getElementById(
        "cancelAddFriend"
    );


/* =========================================
   ABRIR MODAL
========================================= */

function openAddFriend() {

    if (!addFriendModal) {

        return;

    }


    addFriendModal.classList.add(
        "open"
    );


    addFriendModal.setAttribute(
        "aria-hidden",
        "false"
    );


    clearAddFriendModal();


    setTimeout(

        function() {

            if (addFriendUsername) {

                addFriendUsername.focus();

            }

        },

        100

    );

}


/* =========================================
   FECHAR MODAL
========================================= */

function closeAddFriend() {

    if (!addFriendModal) {

        return;

    }


    addFriendModal.classList.remove(
        "open"
    );


    addFriendModal.setAttribute(
        "aria-hidden",
        "true"
    );


    clearAddFriendModal();

}


if (closeAddFriendModal) {

    closeAddFriendModal.addEventListener(

        "click",

        closeAddFriend

    );

}


if (cancelAddFriend) {

    cancelAddFriend.addEventListener(

        "click",

        closeAddFriend

    );

}


/* =========================================
   FECHAR MODAL CLICANDO FORA
========================================= */

if (addFriendModal) {

    addFriendModal.addEventListener(

        "click",

        function(event) {

            if (
                event.target ===
                addFriendModal
            ) {

                closeAddFriend();

            }

        }

    );

}


/* =========================================
   LIMPAR MODAL
========================================= */

function clearAddFriendModal() {

    if (addFriendUsername) {

        addFriendUsername.value =
            "";

    }


    if (addFriendError) {

        addFriendError.textContent =
            "";

    }


    if (addFriendResult) {

        addFriendResult.classList.remove(
            "visible"
        );

    }


    if (sendFriendRequest) {

        sendFriendRequest.disabled =
            false;


        sendFriendRequest.textContent =
            "Adicionar";

    }

}


/* =========================================
   NORMALIZAR USERNAME
========================================= */

function normalizeUsername(username) {

    let value =
        String(username || "")
            .trim();


    if (
        value.startsWith("@")
    ) {

        value =
            value.substring(1);

    }


    return value.toLowerCase();

}


/* =========================================
   PESQUISAR USUÁRIO
========================================= */

if (searchFriendButton) {

    searchFriendButton.addEventListener(

        "click",

        searchUser

    );

}


if (addFriendUsername) {

    addFriendUsername.addEventListener(

        "keydown",

        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                searchUser();

            }

        }

    );

}


/* =========================================
   BUSCAR USUÁRIO
========================================= */

function searchUser() {

    const username =
        normalizeUsername(
            addFriendUsername?.value
        );


    if (!username) {

        showAddFriendError(
            "Digite um nome de usuário."
        );


        hideFriendResult();

        return;

    }


    const currentUsername =
        normalizeUsername(
            currentUser.username
        );


    if (
        username ===
        currentUsername
    ) {

        showAddFriendError(
            "Você não pode adicionar você mesmo."
        );


        hideFriendResult();

        return;

    }


    const foundUser =
        findUserByUsername(
            username
        );


    if (!foundUser) {

        showAddFriendError(
            "Usuário não encontrado."
        );


        hideFriendResult();

        return;

    }


    showFriendResult(
        foundUser
    );

}


/* =========================================
   ENCONTRAR USUÁRIO
========================================= */

function findUserByUsername(username) {

    const normalized =
        normalizeUsername(
            username
        );


    const allUsers = [

        ...friends,

        ...friendRequests

    ];


    return allUsers.find(

        function(user) {

            return (

                normalizeUsername(
                    user.username
                ) === normalized

            );

        }

    ) || null;

}


/* =========================================
   MOSTRAR RESULTADO
========================================= */

function showFriendResult(user) {

    if (!addFriendResult) {

        return;

    }


    if (resultUserName) {

        resultUserName.textContent =
            user.name ||
            "Usuário";

    }


    if (resultUserUsername) {

        resultUserUsername.textContent =
            user.username ||
            "@usuario";

    }


    addFriendResult.classList.add(
        "visible"
    );


    clearAddFriendError();

}


/* =========================================
   ESCONDER RESULTADO
========================================= */

function hideFriendResult() {

    if (addFriendResult) {

        addFriendResult.classList.remove(
            "visible"
        );

    }

}


/* =========================================
   ERRO
========================================= */

function showAddFriendError(message) {

    if (!addFriendError) {

        return;

    }


    addFriendError.textContent =
        message;

}


function clearAddFriendError() {

    if (!addFriendError) {

        return;

    }


    addFriendError.textContent =
        "";

}


/* =========================================
   ENVIAR SOLICITAÇÃO
========================================= */

if (sendFriendRequest) {

    sendFriendRequest.addEventListener(

        "click",

        function() {

            const username =
                resultUserUsername?.textContent;


            if (!username) {

                return;

            }


            console.log(

                "Solicitação enviada para " +
                username

            );


            sendFriendRequest.textContent =
                "Enviado";


            sendFriendRequest.disabled =
                true;

        }

    );

}


/* =========================================
   MENSAGENS
========================================= */

const messageSearch =
    document.getElementById(
        "messageSearch"
    );


const conversationsList =
    document.getElementById(
        "conversationsList"
    );


const messagesEmpty =
    document.getElementById(
        "messagesEmpty"
    );


const newConversationButton =
    document.getElementById(
        "newConversationButton"
    );


const emptyNewConversation =
    document.getElementById(
        "emptyNewConversation"
    );


/* =========================================
   RENDERIZAR CONVERSAS
========================================= */

function renderConversations() {

    if (!conversationsList) {

        return;

    }


    conversationsList.innerHTML =
        "";


    let filtered =
        [...conversations];


    const search =
        messageSearch
            ?.value
            .trim()
            .toLowerCase();


    if (search) {

        filtered =
            filtered.filter(

                function(conversation) {

                    const name =
                        String(
                            conversation.name ||
                            ""
                        ).toLowerCase();


                    const username =
                        String(
                            conversation.username ||
                            ""
                        ).toLowerCase();


                    return (

                        name.includes(
                            search
                        ) ||

                        username.includes(
                            search
                        )

                    );

                }

            );

    }


    if (
        filtered.length ===
        0
    ) {

        messagesEmpty?.classList.add(
            "visible"
        );

        return;

    }


    messagesEmpty?.classList.remove(
        "visible"
    );


    filtered.forEach(

        function(conversation) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "conversation-card";


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                conversation.name ||
                "Usuário";


            const username =
                document.createElement(
                    "span"
                );


            username.textContent =
                conversation.username ||
                "@usuario";


            card.appendChild(
                name
            );


            card.appendChild(
                username
            );


            card.addEventListener(

                "click",

                function() {

                    openConversation(
                        conversation
                    );

                }

            );


            conversationsList.appendChild(
                card
            );

        }

    );

}


/* =========================================
   PESQUISA DE CONVERSAS
========================================= */

if (messageSearch) {

    messageSearch.addEventListener(

        "input",

        renderConversations

    );

}


/* =========================================
   NOVA CONVERSA
========================================= */

if (newConversationButton) {

    newConversationButton.addEventListener(

        "click",

        openNewConversation

    );

}


if (emptyNewConversation) {

    emptyNewConversation.addEventListener(

        "click",

        openNewConversation

    );

}


function openNewConversation() {

    showMessages();

}


/* =========================================
   ABRIR CONVERSA
========================================= */

function openConversation(person = null) {

    showMessages();


    if (!person) {

        console.log(
            "Abrindo nova conversa."
        );

        return;

    }


    console.log(

        "Abrindo conversa com " +
        (
            person.name ||
            "Usuário"
        )

    );

}


/* =========================================
   CHAMADAS
========================================= */

function startCall(person = null) {

    if (person) {

        console.log(

            "Iniciando chamada com " +
            (
                person.name ||
                "Usuário"
            )

        );

        return;

    }


    console.log(
        "Iniciando chamada."
    );

}


/* =========================================
   NIGHTCALL
========================================= */

window.Nightcall = {

    showHome,

    showFriends,

    showMessages,

    openConversation,

    startCall,

    openSettings,

    closeSettings,

    openAddFriend,

    closeAddFriend,

    updateOnlineCount,

    renderFriends,

    renderConversations,

    setCurrentPage

};


console.log(
    "Parte principal do Nightcall carregada."
);


/* =========================================
   NIGHTCALL — CONFIGURAÇÕES
========================================= */


/* =========================================
   DADOS PADRÃO
========================================= */

const DEFAULT_PROFILE = {

    name: "Usuário",

    username: "usuario",

    bio: "",

    avatar: ""

};


const DEFAULT_AUDIO = {

    microphoneEnabled: false,

    microphoneVolume: 100,

    outputVolume: 100

};


const DEFAULT_NOTIFICATIONS = {

    messages: true,

    friends: true,

    calls: true

};


const DEFAULT_PRIVACY = {

    messagePrivacy: "friends",

    friendPrivacy: "everyone",

    onlineStatus: true

};


/* =========================================
   ELEMENTOS DAS CONFIGURAÇÕES
========================================= */

const settingsNavItems =
    document.querySelectorAll(
        ".settings-nav-item"
    );


const settingsSections = {

    profile:
        document.getElementById(
            "profileSection"
        ),

    audio:
        document.getElementById(
            "audioSection"
        ),

    appearance:
        document.getElementById(
            "appearanceSection"
        ),

    notifications:
        document.getElementById(
            "notificationsSection"
        ),

    privacy:
        document.getElementById(
            "privacySection"
        )

};


const sectionInformation = {

    profile: {

        label: "PERFIL",

        title: "Perfil",

        description:
            "Personalize as informações que aparecem no seu perfil."

    },


    audio: {

        label: "ÁUDIO",

        title: "Voz e vídeo",

        description:
            "Configure seu microfone e a saída de áudio."

    },


    appearance: {

        label: "APARÊNCIA",

        title: "Aparência",

        description:
            "Escolha como o Nightcall deve aparecer."

    },


    notifications: {

        label: "NOTIFICAÇÕES",

        title: "Notificações",

        description:
            "Controle quais avisos você deseja receber."

    },


    privacy: {

        label: "PRIVACIDADE",

        title: "Privacidade",

        description:
            "Controle quem poderá interagir com você."

    }

};


const sectionLabel =
    document.getElementById(
        "sectionLabel"
    );


const sectionTitle =
    document.getElementById(
        "sectionTitle"
    );


const sectionDescription =
    document.getElementById(
        "sectionDescription"
    );


/* =========================================
   TROCAR SEÇÃO
========================================= */

function openSection(sectionName) {

    if (
        !settingsSections[
            sectionName
        ]
    ) {

        return;

    }


    settingsNavItems.forEach(

        function(item) {

            item.classList.toggle(

                "active",

                item.dataset.section ===
                sectionName

            );

        }

    );


    Object.values(
        settingsSections
    ).forEach(

        function(section) {

            if (section) {

                section.classList.remove(
                    "active"
                );

            }

        }

    );


    settingsSections[
        sectionName
    ].classList.add(
        "active"
    );


    const info =
        sectionInformation[
            sectionName
        ];


    if (sectionLabel) {

        sectionLabel.textContent =
            info.label;

    }


    if (sectionTitle) {

        sectionTitle.textContent =
            info.title;

    }


    if (sectionDescription) {

        sectionDescription.textContent =
            info.description;

    }


    localStorage.setItem(

        "nightcallLastSettingsSection",

        sectionName

    );

}


settingsNavItems.forEach(

    function(item) {

        item.addEventListener(

            "click",

            function() {

                openSection(
                    item.dataset.section
                );

            }

        );

    }

);


/* =========================================
   PERFIL
========================================= */

const profileName =
    document.getElementById(
        "profileName"
    );


const profileUsername =
    document.getElementById(
        "profileUsername"
    );


const profileBio =
    document.getElementById(
        "profileBio"
    );


const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );


const previewName =
    document.getElementById(
        "previewName"
    );


const previewUsername =
    document.getElementById(
        "previewUsername"
    );


const previewBio =
    document.getElementById(
        "previewBio"
    );


const avatarPreview =
    document.getElementById(
        "avatarPreview"
    );


const avatarPlaceholder =
    document.getElementById(
        "avatarPlaceholder"
    );


const bioCount =
    document.getElementById(
        "bioCount"
    );


const saveProfile =
    document.getElementById(
        "saveProfile"
    );


function getProfile() {

    return readStorage(

        "nightcallProfile",

        DEFAULT_PROFILE

    );

}


/* =========================================
   ATUALIZAR PREVIEW
========================================= */

function updateProfilePreview() {

    if (
        !profileName ||
        !profileUsername ||
        !profileBio ||
        !profileAvatar
    ) {

        return;

    }


    const name =
        profileName.value.trim() ||
        "Usuário";


    const username =
        profileUsername.value
            .trim()
            .replace(
                /^@/,
                ""
            ) ||
        "usuario";


    const bio =
        profileBio.value.trim();


    const avatar =
        profileAvatar.value.trim();


    if (previewName) {

        previewName.textContent =
            name;

    }


    if (previewUsername) {

        previewUsername.textContent =
            "@" +
            username;

    }


    if (previewBio) {

        previewBio.textContent =
            bio ||
            "Nenhuma bio adicionada.";

    }


    if (
        avatar &&
        avatarPreview
    ) {

        avatarPreview.src =
            avatar;


        avatarPreview.classList.add(
            "visible"
        );


        if (avatarPlaceholder) {

            avatarPlaceholder.style.display =
                "none";

        }

    }

    else {

        if (avatarPreview) {

            avatarPreview.removeAttribute(
                "src"
            );


            avatarPreview.classList.remove(
                "visible"
            );

        }


        if (avatarPlaceholder) {

            avatarPlaceholder.style.display =
                "inline";

        }

    }

}


/* =========================================
   CARREGAR PERFIL
========================================= */

function loadProfile() {

    if (
        !profileName ||
        !profileUsername ||
        !profileBio ||
        !profileAvatar
    ) {

        return;

    }


    const profile =
        getProfile();


    profileName.value =
        profile.name;


    profileUsername.value =
        profile.username;


    profileBio.value =
        profile.bio;


    profileAvatar.value =
        profile.avatar;


    updateBioCount();

    updateProfilePreview();

}


/* =========================================
   SALVAR PERFIL
========================================= */

function saveProfileData() {

    if (
        !profileName ||
        !profileUsername ||
        !profileBio ||
        !profileAvatar
    ) {

        return;

    }


    const profile = {

        name:
            profileName.value.trim() ||
            "Usuário",


        username:
            profileUsername.value
                .trim()
                .replace(
                    /^@/,
                    ""
                ) ||
            "usuario",


        bio:
            profileBio.value.trim(),


        avatar:
            profileAvatar.value.trim()

    };


    writeStorage(

        "nightcallProfile",

        profile

    );


    localStorage.setItem(

        "nightcallName",

        profile.name

    );


    localStorage.setItem(

        "nightcallUsername",

        profile.username

    );


    localStorage.setItem(

        "nightcallAvatar",

        profile.avatar

    );


    document.dispatchEvent(

        new CustomEvent(
            "nightcallProfileSaved"
        )

    );


    updateProfilePreview();


    showToast(
        "Perfil salvo com sucesso ✓"
    );

}


if (saveProfile) {

    saveProfile.addEventListener(

        "click",

        saveProfileData

    );

}


/* =========================================
   ATUALIZAR PERFIL ENQUANTO DIGITA
========================================= */

if (profileName) {

    profileName.addEventListener(

        "input",

        updateProfilePreview

    );

}


if (profileUsername) {

    profileUsername.addEventListener(

        "input",

        updateProfilePreview

    );

}


if (profileBio) {

    profileBio.addEventListener(

        "input",

        function() {

            updateBioCount();

            updateProfilePreview();

        }

    );

}


if (profileAvatar) {

    profileAvatar.addEventListener(

        "input",

        updateProfilePreview

    );

}


/* =========================================
   CONTADOR DA BIO
========================================= */

function updateBioCount() {

    if (
        !profileBio ||
        !bioCount
    ) {

        return;

    }


    bioCount.textContent =
        profileBio.value.length;

}


/* =========================================
   ÁUDIO
========================================= */

const microphoneEnabled =
    document.getElementById(
        "microphoneEnabled"
    );


const microphoneVolume =
    document.getElementById(
        "microphoneVolume"
    );


const microphoneVolumeValue =
    document.getElementById(
        "microphoneVolumeValue"
    );


const outputVolume =
    document.getElementById(
        "outputVolume"
    );


const outputVolumeValue =
    document.getElementById(
        "outputVolumeValue"
    );


const testMicrophone =
    document.getElementById(
        "testMicrophone"
    );


const microphoneStatus =
    document.getElementById(
        "microphoneStatus"
    );


function getAudio() {

    return readStorage(

        "nightcallAudio",

        DEFAULT_AUDIO

    );

}


function loadAudio() {

    if (
        !microphoneEnabled ||
        !microphoneVolume ||
        !outputVolume
    ) {

        return;

    }


    const audio =
        getAudio();


    microphoneEnabled.checked =
        audio.microphoneEnabled;


    microphoneVolume.value =
        audio.microphoneVolume;


    outputVolume.value =
        audio.outputVolume;


    updateVolumeLabels();

}


function saveAudio() {

    if (
        !microphoneEnabled ||
        !microphoneVolume ||
        !outputVolume
    ) {

        return;

    }


    writeStorage(

        "nightcallAudio",

        {

            microphoneEnabled:
                microphoneEnabled.checked,


            microphoneVolume:
                Number(
                    microphoneVolume.value
                ),


            outputVolume:
                Number(
                    outputVolume.value
                )

        }

    );

}


function updateVolumeLabels() {

    if (
        microphoneVolumeValue &&
        microphoneVolume
    ) {

        microphoneVolumeValue.textContent =
            microphoneVolume.value +
            "%";

    }


    if (
        outputVolumeValue &&
        outputVolume
    ) {

        outputVolumeValue.textContent =
            outputVolume.value +
            "%";

    }

}


if (microphoneEnabled) {

    microphoneEnabled.addEventListener(

        "change",

        saveAudio

    );

}


if (microphoneVolume) {

    microphoneVolume.addEventListener(

        "input",

        function() {

            updateVolumeLabels();

            saveAudio();

        }

    );

}


if (outputVolume) {

    outputVolume.addEventListener(

        "input",

        function() {

            updateVolumeLabels();

            saveAudio();

        }

    );

}


/* =========================================
   TESTAR MICROFONE
========================================= */

if (testMicrophone) {

    testMicrophone.addEventListener(

        "click",

        async function() {

            if (microphoneStatus) {

                microphoneStatus.textContent =
                    "Solicitando acesso ao microfone...";

            }


            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                if (microphoneStatus) {

                    microphoneStatus.textContent =
                        "Seu navegador não permite acessar o microfone.";

                }

                return;

            }


            try {

                const stream =
                    await navigator.mediaDevices
                        .getUserMedia({
                            audio: true
                        });


                stream
                    .getTracks()
                    .forEach(

                        function(track) {

                            track.stop();

                        }

                    );


                if (microphoneStatus) {

                    microphoneStatus.textContent =
                        "Microfone funcionando corretamente ✓";

                }


                if (microphoneEnabled) {

                    microphoneEnabled.checked =
                        true;

                }


                saveAudio();

            }

            catch (error) {

                console.error(
                    error
                );


                if (microphoneStatus) {

                    microphoneStatus.textContent =
                        "Permissão do microfone negada ou indisponível.";

                }

            }

        }

    );

}


/* =========================================
   NOTIFICAÇÕES
========================================= */

const messageNotifications =
    document.getElementById(
        "messageNotifications"
    );


const friendNotifications =
    document.getElementById(
        "friendNotifications"
    );


const callNotifications =
    document.getElementById(
        "callNotifications"
    );


function loadNotifications() {

    if (
        !messageNotifications ||
        !friendNotifications ||
        !callNotifications
    ) {

        return;

    }


    const notifications =
        readStorage(

            "nightcallNotifications",

            DEFAULT_NOTIFICATIONS

        );


    messageNotifications.checked =
        notifications.messages;


    friendNotifications.checked =
        notifications.friends;


    callNotifications.checked =
        notifications.calls;

}


function saveNotifications() {

    if (
        !messageNotifications ||
        !friendNotifications ||
        !callNotifications
    ) {

        return;

    }


    writeStorage(

        "nightcallNotifications",

        {

            messages:
                messageNotifications.checked,


            friends:
                friendNotifications.checked,


            calls:
                callNotifications.checked

        }

    );

}


if (messageNotifications) {

    messageNotifications.addEventListener(

        "change",

        saveNotifications

    );

}


if (friendNotifications) {

    friendNotifications.addEventListener(

        "change",

        saveNotifications

    );

}


if (callNotifications) {

    callNotifications.addEventListener(

        "change",

        saveNotifications

    );

}


/* =========================================
   PRIVACIDADE
========================================= */

const messagePrivacy =
    document.getElementById(
        "messagePrivacy"
    );


const friendPrivacy =
    document.getElementById(
        "friendPrivacy"
    );


const onlineStatus =
    document.getElementById(
        "onlineStatus"
    );


const savePrivacy =
    document.getElementById(
        "savePrivacy"
    );


function loadPrivacy() {

    if (
        !messagePrivacy ||
        !friendPrivacy ||
        !onlineStatus
    ) {

        return;

    }


    const privacy =
        readStorage(

            "nightcallPrivacy",

            DEFAULT_PRIVACY

        );


    messagePrivacy.value =
        privacy.messagePrivacy;


    friendPrivacy.value =
        privacy.friendPrivacy;


    onlineStatus.checked =
        privacy.onlineStatus;

}


if (savePrivacy) {

    savePrivacy.addEventListener(

        "click",

        function() {

            if (
                !messagePrivacy ||
                !friendPrivacy ||
                !onlineStatus
            ) {

                return;

            }


            writeStorage(

                "nightcallPrivacy",

                {

                    messagePrivacy:
                        messagePrivacy.value,


                    friendPrivacy:
                        friendPrivacy.value,


                    onlineStatus:
                        onlineStatus.checked

                }

            );


            showToast(
                "Configurações de privacidade salvas ✓"
            );

        }

    );

}


/* =========================================
   TOAST
========================================= */

const toast =
    document.getElementById(
        "toast"
    );


let toastTimer =
    null;


function showToast(message) {

    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(

            function() {

                toast.classList.remove(
                    "show"
                );

            },

            2200

        );

}


/* =========================================
   PREVIEW DA FOTO
========================================= */

if (avatarPreview) {

    avatarPreview.addEventListener(

        "error",

        function() {

            avatarPreview.classList.remove(
                "visible"
            );


            if (avatarPlaceholder) {

                avatarPlaceholder.style.display =
                    "inline";

            }

        }

    );

}


/* =========================================
   INICIALIZAR CONFIGURAÇÕES
========================================= */

loadProfile();

loadAudio();

loadNotifications();

loadPrivacy();


const lastSection =
    localStorage.getItem(
        "nightcallLastSettingsSection"
    );


if (
    lastSection &&
    settingsSections[lastSection]
) {

    openSection(
        lastSection
    );

}

else {

    openSection(
        "profile"
    );

}


updateSettingsMiniProfile();


console.log(
    "Configurações carregadas."
);