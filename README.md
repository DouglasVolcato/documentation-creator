# Criador de documentação
Sistema para criação fácil de documentação baseado em arquivos HTML.

### Como rodar o projeto:
Tendo o NodeJS instalado, execute o comando `node index.js` na raiz do projeto. Também é possível executar o arquivo `run.cmd` caso esteja em uma máquina Windows.

O projeto rodará por padrão em `http://localhost:3000`

### Como adicionar uma nova página:
Crie um arquivo HTML na pasta ou subpasta correspondente, isso já criará automáticamente um novo item de menu na barra de navegação. Exemplo:
```
src/plantões/ponto/processamento-de-arquivos.html
```

### Como adicionar um arquivo:
Os arquivos devem ser colocastos na pasta `files` e podem ser acessados pelos arquivos HTML da seguinte maneira:
```
<img src="http://localhost:3000/files/imagem.png" alt="Imagem">
<a href="http://localhost:3000/files/tabela.pdf" target="_blank">Arquivo PDF</a>
```

### Colo colocar escrita em markdown:
A escrita em markdown pode ser feita escrevendo dentro de uma div com id 'markdown', ela será automaticamente convertida para html. Por exemplo:
```
<div id="markdown">
  # Título 

  ## Subtítulo 
  [Link](https://google.com)
  ![Imagem](http://localhost:3000/files/imagem.png) 
  ```
  console.log('Hello, world!'); 
  ``` 

  ### Lista 
  - Item 1 
  - Item 2
</div>
```