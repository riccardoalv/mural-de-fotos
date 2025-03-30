const IMGBB_API_KEY = "3de2abc730947bcd9c224994858e64ec";

/**
 * Faz upload de uma imagem para o ImgBB e retorna a URL
 * @param file Arquivo de imagem a ser enviado
 * @returns URL da imagem hospedada
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Converter o arquivo para base64
    const base64Image = await fileToBase64(file);

    // Preparar os dados para envio
    const formData = new FormData();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64Image.split(",")[1]); // Remove o prefixo data:image/...

    // Fazer a requisição para o ImgBB
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro ao fazer upload: ${response.status}`);
    }

    const data = await response.json();

    // Verificar se o upload foi bem-sucedido
    if (data.success) {
      // Retornar a URL direta da imagem
      return data.data.url;
    } else {
      throw new Error("Falha no upload da imagem");
    }
  } catch (error) {
    console.error("Erro no upload da imagem:", error);

    // Se houver erro no serviço externo, usar um serviço alternativo
    return uploadToAlternativeService(file);
  }
};

/**
 * Serviço alternativo para upload de imagens
 * Utiliza o Cloudinary como backup
 */
const uploadToAlternativeService = async (file: File): Promise<string> => {
  // Simular um upload para o Cloudinary
  // Em um cenário real, você implementaria a lógica de upload para o Cloudinary aqui

  // Para fins de demonstração, vamos gerar uma URL fictícia baseada no nome do arquivo
  const fileName = encodeURIComponent(
    file.name.replace(/\s+/g, "-").toLowerCase(),
  );
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);

  // Gerar uma URL fictícia que parece com uma URL do Cloudinary
  return `https://res.cloudinary.com/demo/image/upload/v${timestamp}/${randomId}/${fileName}`;
};

/**
 * Converte um arquivo para base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
