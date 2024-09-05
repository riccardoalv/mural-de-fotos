// Seleciona o modal e a imagem
var modal = document.getElementById("photoModal");
var modalImage = document.getElementById("modalImage");

// Seleciona todas as imagens na grid
var images = document.querySelectorAll(".photo img");

// Seleciona o botão de fechar o modal
var closeBtn = document.getElementsByClassName("close")[0];

// Adiciona evento de clique em cada imagem para abrir o modal
images.forEach(function(img) {
    img.onclick = function() {
        modal.style.display = "block";
        modalImage.src = this.src; // Define a imagem do modal com a imagem clicada
    }
});

// Fecha o modal quando o botão de fechar for clicado
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Fecha o modal quando clicar fora da imagem/modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

