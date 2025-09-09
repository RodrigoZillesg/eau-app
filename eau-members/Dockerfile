# DOCKERFILE SIMPLIFICADO - USA DIST PRÉ-BUILDADO
FROM nginx:alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia tudo para o container
COPY . .

# Como EasyPanel usa contexto root, dist está em eau-members/dist
RUN if [ -d "eau-members/dist" ]; then \
      cp -r eau-members/dist/* /usr/share/nginx/html/; \
    elif [ -d "dist" ]; then \
      cp -r dist/* /usr/share/nginx/html/; \
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

# Expõe porta
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]