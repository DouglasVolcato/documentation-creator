# Criador de documentação
Sistema para criação fácil de documentação baseado em arquivos HTML.

### Como rodar o projeto:
Tendo o NodeJS instalado, execute o comando `node index.js` na raiz do projeto. Também é possível executar o arquivo `run.cmd` caso esteja em uma máquina Windows.

### Como adicionar uma nova página:
Crie um arquivo HTML na pasta ou subpasta correspondente, isso já criará automáticamente um novo item de menu na barra de navegação. Exemplo:
```
src/plantões/ponto/processamento-de-arquivos.html
```

### Como adicionar um arquivo:
Os arquivos devem ser colocastos na pasta `files` e podem ser acessados pelos arquivos HTML da seguinte maneira:
```
<img src="./files/imagem.png" alt="Imagem">
<a href="./files/tabela.pdf" target="_blank">Arquivo PDF</a>
```