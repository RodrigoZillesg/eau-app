# DOCKERFILE SIMPLIFICADO - USA DIST PRÉ-BUILDADO
FROM nginx:alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tudo para o container
COPY . .

# Debug: Mostrar estrutura de diretórios
RUN echo "=== Current directory ===" && pwd && \
    echo "=== Root contents ===" && ls -la / && \
    echo "=== Current contents ===" && ls -la && \
    echo "=== Looking for eau-members ===" && ls -la eau-members/ 2>/dev/null || echo "eau-members not found" && \
    echo "=== Looking for dist ===" && ls -la dist/ 2>/dev/null || echo "dist not found" && \
    echo "=== Looking for eau-members/dist ===" && ls -la eau-members/dist/ 2>/dev/null || echo "eau-members/dist not found"

# Como EasyPanel usa contexto root, dist está em eau-members/dist
RUN if [ -d "eau-members/dist" ]; then \
      echo "Found eau-members/dist, copying..." && \
      cp -r eau-members/dist/* /usr/share/nginx/html/ && \
      echo "Contents copied to nginx:" && ls -la /usr/share/nginx/html/; \
    elif [ -d "dist" ]; then \
      echo "Found dist, copying..." && \
      cp -r dist/* /usr/share/nginx/html/ && \
      echo "Contents copied to nginx:" && ls -la /usr/share/nginx/html/; \
    else \
      echo "ERROR: dist folder not found!" && ls -la && exit 1; \
    fi

# Copia nginx.conf (tenta ambos os locais)
RUN if [ -f "eau-members/nginx.conf" ]; then \
      cp eau-members/nginx.conf /etc/nginx/conf.d/default.conf; \
    elif [ -f "nginx.conf" ]; then \
      cp nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
      echo "ERROR: nginx.conf not found!" && ls -la && exit 1; \
    fi

# Verificação final
RUN echo "=== Final nginx html contents ===" && \
    ls -la /usr/share/nginx/html/ && \
    echo "=== Checking for assets ===" && \
    ls -la /usr/share/nginx/html/assets/ 2>/dev/null || echo "No assets folder!"

# Expõe porta
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]