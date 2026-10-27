-- Sistema de Onboarding Corporativo (Multi-Tenant)
-- Compatível com MySQL 8.0.16+
CREATE DATABASE IF NOT EXISTS onboarding_corporativo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE onboarding_corporativo;

CREATE TABLE usuario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuario_email (email)
) ENGINE=InnoDB;

CREATE TABLE empresa (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200) NOT NULL,
  cnpj CHAR(14) NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_empresa_cnpj (cnpj)
) ENGINE=InnoDB;

CREATE TABLE token_senha (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  tipo ENUM('RESET','CONVITE') NOT NULL DEFAULT 'RESET',
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_token_senha_hash (token_hash),
  KEY idx_token_senha_usuario (usuario_id),
  CONSTRAINT fk_token_senha_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cargo (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  UNIQUE KEY uk_cargo_empresa_nome (empresa_id, nome),
  UNIQUE KEY uk_cargo_empresa_id (empresa_id, id),
  CONSTRAINT fk_cargo_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
) ENGINE=InnoDB;

CREATE TABLE empresa_usuario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  cargo_id BIGINT UNSIGNED NULL,
  papel ENUM('ADMIN','GESTOR','INSTRUTOR','COLABORADOR') NOT NULL DEFAULT 'COLABORADOR',
  status ENUM('ATIVO','INATIVO','CONVIDADO') NOT NULL DEFAULT 'CONVIDADO',
  data_entrada DATE NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_vinculo_empresa_usuario (empresa_id, usuario_id),
  UNIQUE KEY uk_vinculo_empresa_id (empresa_id, id),
  KEY idx_vinculo_usuario (usuario_id),
  KEY idx_vinculo_empresa_cargo (empresa_id, cargo_id),
  CONSTRAINT fk_vinculo_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  CONSTRAINT fk_vinculo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT fk_vinculo_cargo_empresa FOREIGN KEY (empresa_id, cargo_id)
    REFERENCES cargo(empresa_id, id)
) ENGINE=InnoDB;

CREATE TABLE trilha (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NULL,
  obrigatoria BOOLEAN NOT NULL DEFAULT FALSE,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_trilha_empresa_id (empresa_id, id),
  CONSTRAINT fk_trilha_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
) ENGINE=InnoDB;

CREATE TABLE material (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NULL,
  tipo ENUM('VIDEO','POP','FICHA_TECNICA') NOT NULL,
  versao INT UNSIGNED NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_material_empresa_id (empresa_id, id),
  CONSTRAINT fk_material_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  CONSTRAINT chk_material_versao CHECK (versao >= 1)
) ENGINE=InnoDB;

CREATE TABLE video (
  material_id BIGINT UNSIGNED PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  duracao_segundos INT UNSIGNED NULL,
  CONSTRAINT fk_video_material FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pop (
  material_id BIGINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL,
  procedimento LONGTEXT NULL,
  url_documento VARCHAR(2048) NULL,
  CONSTRAINT fk_pop_material FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ficha_tecnica (
  material_id BIGINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL,
  especificacoes LONGTEXT NULL,
  url_documento VARCHAR(2048) NULL,
  CONSTRAINT fk_ficha_material FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trilha_material (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  trilha_id BIGINT UNSIGNED NOT NULL,
  material_id BIGINT UNSIGNED NOT NULL,
  ordem INT UNSIGNED NOT NULL,
  obrigatorio BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uk_trilha_material (trilha_id, material_id),
  UNIQUE KEY uk_trilha_ordem (trilha_id, ordem),
  UNIQUE KEY uk_trilha_material_empresa_id (empresa_id, id),
  KEY idx_tm_empresa_trilha (empresa_id, trilha_id),
  KEY idx_tm_empresa_material (empresa_id, material_id),
  CONSTRAINT fk_tm_trilha FOREIGN KEY (empresa_id, trilha_id) REFERENCES trilha(empresa_id, id),
  CONSTRAINT fk_tm_material FOREIGN KEY (empresa_id, material_id) REFERENCES material(empresa_id, id)
) ENGINE=InnoDB;

CREATE TABLE atribuicao (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  empresa_usuario_id BIGINT UNSIGNED NOT NULL,
  trilha_id BIGINT UNSIGNED NOT NULL,
  atribuido_por BIGINT UNSIGNED NULL,
  data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  prazo DATETIME NULL,
  status ENUM('PENDENTE','EM_ANDAMENTO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
  UNIQUE KEY uk_atribuicao_empresa_id (empresa_id, id),
  KEY idx_atr_vinculo (empresa_id, empresa_usuario_id),
  KEY idx_atr_trilha (empresa_id, trilha_id),
  KEY idx_atr_atribuidor (atribuido_por),
  CONSTRAINT fk_atr_vinculo FOREIGN KEY (empresa_id, empresa_usuario_id)
    REFERENCES empresa_usuario(empresa_id, id),
  CONSTRAINT fk_atr_trilha FOREIGN KEY (empresa_id, trilha_id)
    REFERENCES trilha(empresa_id, id),
  CONSTRAINT fk_atr_atribuidor FOREIGN KEY (atribuido_por) REFERENCES usuario(id),
  CONSTRAINT chk_atr_prazo CHECK (prazo IS NULL OR prazo >= data_inicio)
) ENGINE=InnoDB;

CREATE TABLE progresso (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id BIGINT UNSIGNED NOT NULL,
  atribuicao_id BIGINT UNSIGNED NOT NULL,
  trilha_material_id BIGINT UNSIGNED NOT NULL,
  status ENUM('NAO_INICIADO','EM_ANDAMENTO','CONCLUIDO') NOT NULL DEFAULT 'NAO_INICIADO',
  percentual TINYINT UNSIGNED NOT NULL DEFAULT 0,
  concluido_em DATETIME NULL,
  UNIQUE KEY uk_progresso_atr_item (atribuicao_id, trilha_material_id),
  KEY idx_prog_atr (empresa_id, atribuicao_id),
  KEY idx_prog_item (empresa_id, trilha_material_id),
  CONSTRAINT fk_prog_atr FOREIGN KEY (empresa_id, atribuicao_id)
    REFERENCES atribuicao(empresa_id, id),
  CONSTRAINT fk_prog_item FOREIGN KEY (empresa_id, trilha_material_id)
    REFERENCES trilha_material(empresa_id, id),
  CONSTRAINT chk_prog_percentual CHECK (percentual BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- Regras de negócio para validar na aplicação ou via triggers:
-- 1. video/pop/ficha_tecnica deve corresponder a material.tipo e ocorrer em apenas uma subtabela.
-- 2. progresso.trilha_material_id deve pertencer à mesma trilha que atribuicao.trilha_id.
-- 3. atribuido_por deve possuir permissão apropriada na empresa da atribuição.
-- 4. Status e percentual/concluido_em devem permanecer coerentes.
-- 5. A reutilização de uma mesma trilha para um usuário exige decidir entre impedir
--    atribuições duplicadas ativas ou criar ciclos/tentativas explícitos.
