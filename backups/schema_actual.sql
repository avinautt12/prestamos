/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activaciones_distribuidora` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expira_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usado_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `activaciones_distribuidora_usuario_id_unique` (`usuario_id`),
  UNIQUE KEY `activaciones_distribuidora_token_hash_unique` (`token_hash`),
  KEY `activaciones_distribuidora_usuario_id_usado_en_index` (`usuario_id`,`usado_en`),
  CONSTRAINT `activaciones_distribuidora_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bitacora_auditorias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo_evento` varchar(50) NOT NULL,
  `nivel` varchar(20) NOT NULL DEFAULT 'INFO',
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `usuario_nombre` varchar(255) DEFAULT NULL,
  `usuario_rol` varchar(255) DEFAULT NULL,
  `sucursal_id` bigint(20) unsigned DEFAULT NULL,
  `modulo` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `datos_extra` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_extra`)),
  `ip_address` text DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `bitacora_auditorias_tipo_evento_creado_en_index` (`tipo_evento`,`creado_en`),
  KEY `bitacora_auditorias_modulo_creado_en_index` (`modulo`,`creado_en`),
  KEY `bitacora_auditorias_usuario_id_creado_en_index` (`usuario_id`,`creado_en`),
  KEY `bitacora_auditorias_nivel_creado_en_index` (`nivel`,`creado_en`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bitacora_configuracion_sucursal` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sucursal_configuracion_id` bigint(20) unsigned NOT NULL,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `actualizado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `tipo_evento` enum('SUCURSAL','CATEGORIA','PRODUCTO') NOT NULL,
  `referencia_id` bigint(20) unsigned DEFAULT NULL,
  `cambios_antes_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cambios_antes_json`)),
  `cambios_despues_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cambios_despues_json`)),
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_bcs_cfg` (`sucursal_configuracion_id`),
  KEY `fk_bcs_usuario` (`actualizado_por_usuario_id`),
  KEY `bitacora_configuracion_sucursal_sucursal_id_creado_en_index` (`sucursal_id`,`creado_en`),
  KEY `bitacora_configuracion_sucursal_tipo_evento_referencia_id_index` (`tipo_evento`,`referencia_id`),
  CONSTRAINT `fk_bcs_cfg` FOREIGN KEY (`sucursal_configuracion_id`) REFERENCES `sucursal_configuraciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bcs_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bcs_usuario` FOREIGN KEY (`actualizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bitacora_decisiones_gerente` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `gerente_usuario_id` bigint(20) unsigned NOT NULL,
  `solicitud_id` bigint(20) unsigned NOT NULL,
  `distribuidora_id` bigint(20) unsigned DEFAULT NULL,
  `tipo_evento` enum('NUEVA_DISTRIBUIDORA','INCREMENTO_LIMITE','INCREMENTO_MANUAL','INCREMENTO_SUGERIDO_APROBADO','APROBACION','RECHAZO') NOT NULL,
  `monto_anterior` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_nuevo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `bitacora_decisiones_gerente_distribuidora_id_foreign` (`distribuidora_id`),
  KEY `bitacora_decisiones_gerente_gerente_usuario_id_index` (`gerente_usuario_id`),
  KEY `bitacora_decisiones_gerente_solicitud_id_index` (`solicitud_id`),
  KEY `bitacora_decisiones_gerente_tipo_evento_index` (`tipo_evento`),
  KEY `bitacora_decisiones_gerente_creado_en_index` (`creado_en`),
  CONSTRAINT `bitacora_decisiones_gerente_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `bitacora_decisiones_gerente_gerente_usuario_id_foreign` FOREIGN KEY (`gerente_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `bitacora_decisiones_gerente_solicitud_id_foreign` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias_distribuidora` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `porcentaje_comision` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `puntos_por_cada_1200` int(11) NOT NULL DEFAULT 3,
  `castigo_pct_atraso` decimal(8,4) NOT NULL DEFAULT 20.0000,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorias_distribuidora_codigo_unique` (`codigo`),
  UNIQUE KEY `categorias_distribuidora_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint(20) unsigned NOT NULL,
  `codigo_cliente` varchar(50) DEFAULT NULL,
  `estado` enum('EN_VERIFICACION','ACTIVO','BLOQUEADO','MOROSO','INACTIVO') DEFAULT 'EN_VERIFICACION',
  `notas` text DEFAULT NULL,
  `foto_ine_frente` varchar(255) DEFAULT NULL,
  `foto_ine_reverso` varchar(255) DEFAULT NULL,
  `foto_selfie_ine` varchar(255) DEFAULT NULL,
  `foto_comprobante_domicilio` varchar(255) DEFAULT NULL,
  `cuenta_banco` varchar(255) DEFAULT NULL,
  `cuenta_clabe` varchar(18) DEFAULT NULL,
  `cuenta_titular` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientes_persona_id_unique` (`persona_id`),
  UNIQUE KEY `clientes_codigo_cliente_unique` (`codigo_cliente`),
  CONSTRAINT `clientes_persona_id_foreign` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes_distribuidora` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `estado_relacion` enum('ACTIVA','BLOQUEADA','TERMINADA') NOT NULL DEFAULT 'ACTIVA',
  `prevale_aprobado` tinyint(1) NOT NULL DEFAULT 0,
  `bloqueado_por_parentesco` tinyint(1) NOT NULL DEFAULT 0,
  `observaciones_parentesco` text DEFAULT NULL,
  `vinculado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `desvinculado_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientes_distribuidora_distribuidora_id_cliente_id_unique` (`distribuidora_id`,`cliente_id`),
  KEY `clientes_distribuidora_cliente_id_index` (`cliente_id`),
  KEY `clientes_dist_estado_rel_idx` (`distribuidora_id`,`estado_relacion`),
  KEY `clientes_dist_parentesco_idx` (`distribuidora_id`,`bloqueado_por_parentesco`),
  KEY `clientes_distribuidora_estado_relacion_index` (`estado_relacion`),
  CONSTRAINT `clientes_distribuidora_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `clientes_distribuidora_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conciliaciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pago_distribuidora_id` bigint(20) unsigned NOT NULL,
  `movimiento_bancario_id` bigint(20) unsigned NOT NULL,
  `conciliado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `conciliado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `monto_conciliado` decimal(12,2) NOT NULL,
  `diferencia_monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('CONCILIADA','CON_DIFERENCIA','RECHAZADA') NOT NULL DEFAULT 'CONCILIADA',
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conc_pago_mov_unique` (`pago_distribuidora_id`,`movimiento_bancario_id`),
  UNIQUE KEY `conciliaciones_movimiento_unique` (`movimiento_bancario_id`),
  UNIQUE KEY `conciliaciones_pago_unique` (`pago_distribuidora_id`),
  KEY `conciliaciones_conciliado_por_usuario_id_foreign` (`conciliado_por_usuario_id`),
  KEY `conciliaciones_pago_distribuidora_id_index` (`pago_distribuidora_id`),
  KEY `conciliaciones_movimiento_bancario_id_index` (`movimiento_bancario_id`),
  CONSTRAINT `conciliaciones_conciliado_por_usuario_id_foreign` FOREIGN KEY (`conciliado_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `conciliaciones_movimiento_bancario_id_foreign` FOREIGN KEY (`movimiento_bancario_id`) REFERENCES `movimientos_bancarios` (`id`),
  CONSTRAINT `conciliaciones_pago_distribuidora_id_foreign` FOREIGN KEY (`pago_distribuidora_id`) REFERENCES `pagos_distribuidora` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cortes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `tipo_corte` enum('PAGOS','PUNTOS','MIXTO') NOT NULL DEFAULT 'PAGOS',
  `dia_base_mes` int(11) DEFAULT NULL,
  `hora_base` time DEFAULT NULL,
  `fecha_programada` datetime NOT NULL,
  `fecha_ejecucion` datetime DEFAULT NULL,
  `mantener_fecha_en_inhabil` tinyint(1) NOT NULL DEFAULT 1,
  `estado` enum('PROGRAMADO','EJECUTADO','CERRADO','REPROCESADO') NOT NULL DEFAULT 'PROGRAMADO',
  `observaciones` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `cortes_sucursal_id_index` (`sucursal_id`),
  KEY `cortes_fecha_programada_index` (`fecha_programada`),
  CONSTRAINT `cortes_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cuentas_bancarias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo_propietario` enum('PERSONA','DISTRIBUIDORA','EMPRESA') NOT NULL,
  `propietario_id` bigint(20) unsigned NOT NULL,
  `banco` varchar(100) NOT NULL,
  `nombre_titular` varchar(150) NOT NULL,
  `numero_cuenta_mascarado` varchar(50) DEFAULT NULL,
  `clabe` varchar(30) DEFAULT NULL,
  `convenio` varchar(50) DEFAULT NULL,
  `referencia_base` varchar(100) DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT 0,
  `verificada_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `cuentas_bancarias_tipo_propietario_propietario_id_index` (`tipo_propietario`,`propietario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `distribuidoras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint(20) unsigned NOT NULL,
  `solicitud_id` bigint(20) unsigned DEFAULT NULL,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `coordinador_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `categoria_id` bigint(20) unsigned DEFAULT NULL,
  `cuenta_bancaria_id` bigint(20) unsigned DEFAULT NULL,
  `numero_distribuidora` varchar(50) NOT NULL,
  `estado` enum('CANDIDATA','POSIBLE','ACTIVA','INACTIVA','MOROSA','BLOQUEADA','CERRADA') NOT NULL DEFAULT 'CANDIDATA',
  `limite_credito` decimal(12,2) NOT NULL DEFAULT 0.00,
  `credito_disponible` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sin_limite` tinyint(1) NOT NULL DEFAULT 0,
  `puntos_actuales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `puede_emitir_vales` tinyint(1) NOT NULL DEFAULT 0,
  `es_externa` tinyint(1) NOT NULL DEFAULT 0,
  `activada_en` timestamp NULL DEFAULT NULL,
  `desactivada_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `distribuidoras_persona_id_unique` (`persona_id`),
  UNIQUE KEY `distribuidoras_numero_distribuidora_unique` (`numero_distribuidora`),
  UNIQUE KEY `distribuidoras_solicitud_id_unique` (`solicitud_id`),
  KEY `distribuidoras_coordinador_usuario_id_foreign` (`coordinador_usuario_id`),
  KEY `distribuidoras_categoria_id_foreign` (`categoria_id`),
  KEY `distribuidoras_cuenta_bancaria_id_foreign` (`cuenta_bancaria_id`),
  KEY `distribuidoras_estado_index` (`estado`),
  KEY `distribuidoras_sucursal_id_index` (`sucursal_id`),
  CONSTRAINT `distribuidoras_categoria_id_foreign` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_distribuidora` (`id`),
  CONSTRAINT `distribuidoras_coordinador_usuario_id_foreign` FOREIGN KEY (`coordinador_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `distribuidoras_cuenta_bancaria_id_foreign` FOREIGN KEY (`cuenta_bancaria_id`) REFERENCES `cuentas_bancarias` (`id`),
  CONSTRAINT `distribuidoras_persona_id_foreign` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`),
  CONSTRAINT `distribuidoras_solicitud_id_foreign` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`),
  CONSTRAINT `distribuidoras_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `egresos_empresa_simulados` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vale_id` bigint(20) unsigned NOT NULL,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `ejecutado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `origen` varchar(40) NOT NULL DEFAULT 'VALE_FERIADO',
  `referencia_interna` varchar(120) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha_operacion` datetime NOT NULL,
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `egresos_empresa_simulados_vale_id_unique` (`vale_id`),
  UNIQUE KEY `egresos_empresa_simulados_referencia_interna_unique` (`referencia_interna`),
  KEY `egresos_empresa_simulados_cliente_id_foreign` (`cliente_id`),
  KEY `egresos_empresa_simulados_ejecutado_por_usuario_id_foreign` (`ejecutado_por_usuario_id`),
  KEY `egresos_empresa_simulados_distribuidora_id_fecha_operacion_index` (`distribuidora_id`,`fecha_operacion`),
  CONSTRAINT `egresos_empresa_simulados_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `egresos_empresa_simulados_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `egresos_empresa_simulados_ejecutado_por_usuario_id_foreign` FOREIGN KEY (`ejecutado_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `egresos_empresa_simulados_vale_id_foreign` FOREIGN KEY (`vale_id`) REFERENCES `vales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_credito_score` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `mes_evalucion` varchar(7) NOT NULL,
  `score_base` tinyint(3) unsigned NOT NULL DEFAULT 100,
  `score_final` decimal(5,2) NOT NULL DEFAULT 100.00,
  `factores_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`factores_json`)),
  `incremento_sugerido` decimal(12,2) NOT NULL DEFAULT 0.00,
  `auto_aplicado` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `historial_credito_score_distribuidora_id_mes_evalucion_unique` (`distribuidora_id`,`mes_evalucion`),
  KEY `historial_credito_score_mes_evalucion_index` (`mes_evalucion`),
  CONSTRAINT `historial_credito_score_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_bancarios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cuenta_banco_empresa_id` bigint(20) unsigned DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `fecha_movimiento` date NOT NULL,
  `hora_movimiento` time DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL,
  `tipo_movimiento` varchar(50) DEFAULT NULL,
  `folio` varchar(100) DEFAULT NULL,
  `nombre_pagador` varchar(150) DEFAULT NULL,
  `concepto_raw` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `movimientos_bancarios_cuenta_banco_empresa_id_foreign` (`cuenta_banco_empresa_id`),
  KEY `movimientos_bancarios_referencia_index` (`referencia`),
  KEY `movimientos_bancarios_fecha_movimiento_monto_index` (`fecha_movimiento`,`monto`),
  KEY `mov_banc_fecha_id_idx` (`fecha_movimiento`,`id`),
  KEY `mov_banc_ref_fecha_monto_idx` (`referencia`,`fecha_movimiento`,`monto`),
  CONSTRAINT `movimientos_bancarios_cuenta_banco_empresa_id_foreign` FOREIGN KEY (`cuenta_banco_empresa_id`) REFERENCES `cuentas_bancarias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_puntos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `vale_id` bigint(20) unsigned DEFAULT NULL,
  `corte_id` bigint(20) unsigned DEFAULT NULL,
  `pago_cliente_id` bigint(20) unsigned DEFAULT NULL,
  `tipo_movimiento` enum('GANADO_ANTICIPADO','GANADO_PUNTUAL','PENALIZACION_ATRASO','AJUSTE_MANUAL','REVERSO','CANJE') NOT NULL,
  `puntos` decimal(12,2) NOT NULL,
  `valor_punto_snapshot` decimal(12,2) NOT NULL DEFAULT 2.00,
  `motivo` varchar(255) DEFAULT NULL,
  `fecha_movimiento` timestamp NOT NULL DEFAULT current_timestamp(),
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `movimientos_puntos_pago_cliente_id_foreign` (`pago_cliente_id`),
  KEY `movimientos_puntos_distribuidora_id_index` (`distribuidora_id`),
  KEY `movimientos_puntos_vale_id_index` (`vale_id`),
  KEY `movimientos_puntos_corte_id_index` (`corte_id`),
  CONSTRAINT `movimientos_puntos_corte_id_foreign` FOREIGN KEY (`corte_id`) REFERENCES `cortes` (`id`),
  CONSTRAINT `movimientos_puntos_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `movimientos_puntos_pago_cliente_id_foreign` FOREIGN KEY (`pago_cliente_id`) REFERENCES `pagos_cliente` (`id`),
  CONSTRAINT `movimientos_puntos_vale_id_foreign` FOREIGN KEY (`vale_id`) REFERENCES `vales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(255) NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos_cliente` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vale_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `cobrado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `fecha_pago` datetime NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `metodo_pago` enum('EFECTIVO','TRANSFERENCIA') NOT NULL DEFAULT 'EFECTIVO',
  `es_parcial` tinyint(1) NOT NULL DEFAULT 0,
  `afecta_puntos` tinyint(1) NOT NULL DEFAULT 1,
  `notas` text DEFAULT NULL,
  `revertido_en` timestamp NULL DEFAULT NULL,
  `revertido_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `motivo_reversion` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pagos_cliente_cliente_id_foreign` (`cliente_id`),
  KEY `pagos_cliente_cobrado_por_usuario_id_foreign` (`cobrado_por_usuario_id`),
  KEY `pagos_cliente_vale_id_index` (`vale_id`),
  KEY `pagos_cliente_fecha_pago_index` (`fecha_pago`),
  KEY `pagos_cliente_distribuidora_id_index` (`distribuidora_id`),
  KEY `pagos_cliente_revertido_por_usuario_id_foreign` (`revertido_por_usuario_id`),
  KEY `pagos_cliente_revertido_en_index` (`revertido_en`),
  CONSTRAINT `pagos_cliente_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `pagos_cliente_cobrado_por_usuario_id_foreign` FOREIGN KEY (`cobrado_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `pagos_cliente_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `pagos_cliente_revertido_por_usuario_id_foreign` FOREIGN KEY (`revertido_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `pagos_cliente_vale_id_foreign` FOREIGN KEY (`vale_id`) REFERENCES `vales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos_distribuidora` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `relacion_corte_id` bigint(20) unsigned NOT NULL,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `cuenta_banco_empresa_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL,
  `metodo_pago` enum('TRANSFERENCIA','DEPOSITO','OTRO') NOT NULL DEFAULT 'TRANSFERENCIA',
  `referencia_reportada` varchar(100) DEFAULT NULL,
  `fecha_pago` datetime NOT NULL,
  `estado` enum('REPORTADO','DETECTADO','CONCILIADO','RECHAZADO') NOT NULL DEFAULT 'REPORTADO',
  `observaciones` text DEFAULT NULL,
  `desglose_vales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desglose_vales`)),
  `desglose_aplicado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pagos_distribuidora_cuenta_banco_empresa_id_foreign` (`cuenta_banco_empresa_id`),
  KEY `pagos_distribuidora_relacion_corte_id_index` (`relacion_corte_id`),
  KEY `pagos_distribuidora_distribuidora_id_index` (`distribuidora_id`),
  KEY `pagos_dist_rel_estado_idx` (`relacion_corte_id`,`estado`),
  KEY `pagos_dist_dist_estado_idx` (`distribuidora_id`,`estado`),
  KEY `pagos_dist_dist_fecha_idx` (`distribuidora_id`,`fecha_pago`),
  KEY `pagos_dist_ref_estado_idx` (`referencia_reportada`,`estado`),
  CONSTRAINT `pagos_distribuidora_cuenta_banco_empresa_id_foreign` FOREIGN KEY (`cuenta_banco_empresa_id`) REFERENCES `cuentas_bancarias` (`id`),
  CONSTRAINT `pagos_distribuidora_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `pagos_distribuidora_relacion_corte_id_foreign` FOREIGN KEY (`relacion_corte_id`) REFERENCES `relaciones_corte` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partidas_relacion_corte` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `relacion_corte_id` bigint(20) unsigned NOT NULL,
  `vale_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `nombre_producto_snapshot` varchar(150) NOT NULL,
  `pagos_realizados` int(11) NOT NULL DEFAULT 0,
  `pagos_totales` int(11) NOT NULL DEFAULT 0,
  `monto_comision` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_pago` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_recargo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_total_linea` decimal(12,2) NOT NULL DEFAULT 0.00,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `partidas_relacion_corte_cliente_id_foreign` (`cliente_id`),
  KEY `partidas_relacion_corte_relacion_corte_id_index` (`relacion_corte_id`),
  KEY `partidas_relacion_corte_vale_id_index` (`vale_id`),
  CONSTRAINT `partidas_relacion_corte_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `partidas_relacion_corte_relacion_corte_id_foreign` FOREIGN KEY (`relacion_corte_id`) REFERENCES `relaciones_corte` (`id`),
  CONSTRAINT `partidas_relacion_corte_vale_id_foreign` FOREIGN KEY (`vale_id`) REFERENCES `vales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `primer_nombre` varchar(100) NOT NULL,
  `segundo_nombre` varchar(100) DEFAULT NULL,
  `apellido_paterno` varchar(100) NOT NULL,
  `apellido_materno` varchar(100) DEFAULT NULL,
  `sexo` enum('M','F','OTRO') DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `curp` varchar(18) DEFAULT NULL,
  `rfc` varchar(13) DEFAULT NULL,
  `telefono_personal` varchar(30) DEFAULT NULL,
  `telefono_celular` varchar(30) DEFAULT NULL,
  `correo_electronico` varchar(150) DEFAULT NULL,
  `calle` varchar(150) DEFAULT NULL,
  `numero_exterior` varchar(30) DEFAULT NULL,
  `colonia` varchar(120) DEFAULT NULL,
  `ciudad` varchar(120) DEFAULT NULL,
  `estado` varchar(120) DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `personas_curp_unique` (`curp`),
  UNIQUE KEY `personas_rfc_unique` (`rfc`),
  KEY `personas_apellido_paterno_apellido_materno_primer_nombre_index` (`apellido_paterno`,`apellido_materno`,`primer_nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos_financieros` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `monto_principal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `numero_quincenas` int(11) NOT NULL,
  `porcentaje_comision_empresa` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `monto_seguro` decimal(12,2) NOT NULL DEFAULT 0.00,
  `porcentaje_interes_quincenal` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `monto_multa_tardia` decimal(12,2) NOT NULL DEFAULT 0.00,
  `modo_desembolso` enum('TRANSFERENCIA','EFECTIVO','MIXTO') NOT NULL DEFAULT 'TRANSFERENCIA',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productos_financieros_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `puntos_conf` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `factor_divisor_puntos` int(10) unsigned NOT NULL DEFAULT 1200,
  `multiplicador_puntos` int(10) unsigned NOT NULL DEFAULT 3,
  `valor_punto_mxn` decimal(12,2) NOT NULL DEFAULT 2.00,
  `castigo_pct_atraso` decimal(8,4) NOT NULL DEFAULT 20.0000,
  `actualizado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `puntos_conf_actualizado_por_usuario_id_foreign` (`actualizado_por_usuario_id`),
  CONSTRAINT `puntos_conf_actualizado_por_usuario_id_foreign` FOREIGN KEY (`actualizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `relaciones_corte` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `corte_id` bigint(20) unsigned NOT NULL,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `numero_relacion` varchar(50) NOT NULL,
  `referencia_pago` varchar(100) DEFAULT NULL,
  `fecha_limite_pago` date NOT NULL,
  `fecha_inicio_pago_anticipado` date DEFAULT NULL,
  `fecha_fin_pago_anticipado` date DEFAULT NULL,
  `limite_credito_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  `credito_disponible_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  `puntos_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_comision` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_pago` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_recargos` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_a_pagar` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` enum('GENERADA','PAGADA','PARCIAL','VENCIDA','CERRADA') NOT NULL DEFAULT 'GENERADA',
  `generada_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `relaciones_corte_numero_relacion_unique` (`numero_relacion`),
  KEY `relaciones_corte_corte_id_index` (`corte_id`),
  KEY `relaciones_corte_distribuidora_id_index` (`distribuidora_id`),
  KEY `rel_corte_dist_estado_idx` (`distribuidora_id`,`estado`),
  KEY `rel_corte_estado_limite_idx` (`estado`,`fecha_limite_pago`),
  KEY `rel_corte_ref_estado_idx` (`referencia_pago`,`estado`),
  CONSTRAINT `relaciones_corte_corte_id_foreign` FOREIGN KEY (`corte_id`) REFERENCES `cortes` (`id`),
  CONSTRAINT `relaciones_corte_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_codigo_unique` (`codigo`),
  UNIQUE KEY `roles_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `persona_solicitante_id` bigint(20) unsigned NOT NULL,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `capturada_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `coordinador_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `verificador_asignado_id` bigint(20) unsigned DEFAULT NULL,
  `cuenta_bancaria_id` bigint(20) unsigned DEFAULT NULL,
  `estado` enum('PRE','MODIFICADA','EN_REVISION','VERIFICADA','POSIBLE_DISTRIBUIDORA','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PRE',
  `categoria_inicial_codigo` varchar(20) NOT NULL DEFAULT 'COBRE',
  `datos_familiares_json` longtext DEFAULT NULL,
  `afiliaciones_externas_json` longtext DEFAULT NULL,
  `vehiculos_json` longtext DEFAULT NULL,
  `limite_credito_solicitado` decimal(12,2) DEFAULT NULL,
  `ine_frente_path` varchar(255) DEFAULT NULL,
  `ine_reverso_path` varchar(255) DEFAULT NULL,
  `comprobante_domicilio_path` varchar(255) DEFAULT NULL,
  `reporte_buro_path` varchar(255) DEFAULT NULL,
  `resultado_buro` varchar(100) DEFAULT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `prevale_aprobado` tinyint(1) NOT NULL DEFAULT 0,
  `fotos_casa_completas` tinyint(1) NOT NULL DEFAULT 0,
  `tomada_en` timestamp NULL DEFAULT NULL,
  `enviada_en` timestamp NULL DEFAULT NULL,
  `revisada_en` timestamp NULL DEFAULT NULL,
  `decidida_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `solicitudes_persona_solicitante_id_foreign` (`persona_solicitante_id`),
  KEY `solicitudes_capturada_por_usuario_id_foreign` (`capturada_por_usuario_id`),
  KEY `solicitudes_cuenta_bancaria_id_foreign` (`cuenta_bancaria_id`),
  KEY `solicitudes_estado_index` (`estado`),
  KEY `solicitudes_sucursal_id_index` (`sucursal_id`),
  KEY `solicitudes_verificador_asignado_id_index` (`verificador_asignado_id`),
  KEY `solicitudes_categoria_inicial_codigo_index` (`categoria_inicial_codigo`),
  KEY `solicitudes_sucursal_estado_idx` (`sucursal_id`,`estado`),
  KEY `solicitudes_coord_estado_idx` (`coordinador_usuario_id`,`estado`),
  CONSTRAINT `solicitudes_capturada_por_usuario_id_foreign` FOREIGN KEY (`capturada_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `solicitudes_coordinador_usuario_id_foreign` FOREIGN KEY (`coordinador_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `solicitudes_cuenta_bancaria_id_foreign` FOREIGN KEY (`cuenta_bancaria_id`) REFERENCES `cuentas_bancarias` (`id`),
  CONSTRAINT `solicitudes_persona_solicitante_id_foreign` FOREIGN KEY (`persona_solicitante_id`) REFERENCES `personas` (`id`),
  CONSTRAINT `solicitudes_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `solicitudes_verificador_asignado_id_foreign` FOREIGN KEY (`verificador_asignado_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_password` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `aprobado_por_id` bigint(20) unsigned DEFAULT NULL,
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA','EXPIRADA') NOT NULL DEFAULT 'PENDIENTE',
  `token_generado` varchar(255) DEFAULT NULL,
  `expira_en` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitudes_password_token_generado_unique` (`token_generado`),
  KEY `solicitudes_password_usuario_id_foreign` (`usuario_id`),
  KEY `solicitudes_password_aprobado_por_id_foreign` (`aprobado_por_id`),
  CONSTRAINT `solicitudes_password_aprobado_por_id_foreign` FOREIGN KEY (`aprobado_por_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `solicitudes_password_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_traspaso_cliente` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `distribuidora_origen_id` bigint(20) unsigned NOT NULL,
  `distribuidora_destino_id` bigint(20) unsigned NOT NULL,
  `solicitada_por_usuario_id` bigint(20) unsigned NOT NULL,
  `coordinador_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `confirmada_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `estado` enum('PENDIENTE_COORDINADOR','APROBADA_CODIGO_EMITIDO','RECHAZADA','CANCELADA','EJECUTADA','EXPIRADA') NOT NULL DEFAULT 'PENDIENTE_COORDINADOR',
  `codigo_confirmacion` varchar(32) DEFAULT NULL,
  `codigo_generado_en` timestamp NULL DEFAULT NULL,
  `codigo_expira_en` timestamp NULL DEFAULT NULL,
  `confirmada_en` timestamp NULL DEFAULT NULL,
  `ejecutada_en` timestamp NULL DEFAULT NULL,
  `motivo_solicitud` text DEFAULT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  `comentarios` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `solicitudes_traspaso_cliente_solicitada_por_usuario_id_foreign` (`solicitada_por_usuario_id`),
  KEY `solicitudes_traspaso_cliente_coordinador_usuario_id_foreign` (`coordinador_usuario_id`),
  KEY `solicitudes_traspaso_cliente_confirmada_por_usuario_id_foreign` (`confirmada_por_usuario_id`),
  KEY `traspaso_destino_estado_idx` (`distribuidora_destino_id`,`estado`),
  KEY `traspaso_origen_estado_idx` (`distribuidora_origen_id`,`estado`),
  KEY `traspaso_cliente_estado_idx` (`cliente_id`,`estado`),
  KEY `traspaso_estado_expira_idx` (`estado`,`codigo_expira_en`),
  CONSTRAINT `solicitudes_traspaso_cliente_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `solicitudes_traspaso_cliente_confirmada_por_usuario_id_foreign` FOREIGN KEY (`confirmada_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `solicitudes_traspaso_cliente_coordinador_usuario_id_foreign` FOREIGN KEY (`coordinador_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `solicitudes_traspaso_cliente_distribuidora_destino_id_foreign` FOREIGN KEY (`distribuidora_destino_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `solicitudes_traspaso_cliente_distribuidora_origen_id_foreign` FOREIGN KEY (`distribuidora_origen_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `solicitudes_traspaso_cliente_solicitada_por_usuario_id_foreign` FOREIGN KEY (`solicitada_por_usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sucursal_configuraciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `dia_corte` tinyint(3) unsigned DEFAULT NULL,
  `hora_corte` time DEFAULT NULL,
  `frecuencia_pago_dias` smallint(5) unsigned NOT NULL DEFAULT 14,
  `plazo_pago_dias` smallint(5) unsigned NOT NULL DEFAULT 15,
  `linea_credito_default` decimal(12,2) NOT NULL DEFAULT 0.00,
  `seguro_tabuladores_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`seguro_tabuladores_json`)),
  `porcentaje_comision_apertura` decimal(6,4) NOT NULL DEFAULT 10.0000,
  `porcentaje_interes_quincenal` decimal(6,4) NOT NULL DEFAULT 5.0000,
  `multa_incumplimiento_monto` decimal(12,2) NOT NULL DEFAULT 300.00,
  `umbral_incremento_auto` decimal(12,2) DEFAULT NULL,
  `porcentaje_incremento_min_score` decimal(5,2) NOT NULL DEFAULT 70.00,
  `categorias_config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categorias_config_json`)),
  `productos_config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`productos_config_json`)),
  `actualizado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sucursal_configuraciones_sucursal_id_unique` (`sucursal_id`),
  KEY `sucursal_configuraciones_actualizado_por_usuario_id_foreign` (`actualizado_por_usuario_id`),
  CONSTRAINT `sucursal_configuraciones_actualizado_por_usuario_id_foreign` FOREIGN KEY (`actualizado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sucursal_configuraciones_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sucursales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion_texto` varchar(255) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sucursales_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sugerencias_incremento_credito` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `score` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `incremento_sugerido` decimal(12,2) NOT NULL,
  `motivo_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`motivo_json`)),
  `estado` enum('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  `aprobada_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `rechazada_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `decidido_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sugerencias_incremento_credito_aprobada_por_usuario_id_foreign` (`aprobada_por_usuario_id`),
  KEY `sugerencias_incremento_credito_rechazada_por_usuario_id_foreign` (`rechazada_por_usuario_id`),
  KEY `sugerencias_incremento_credito_estado_index` (`estado`),
  KEY `sugerencias_incremento_credito_distribuidora_id_estado_index` (`distribuidora_id`,`estado`),
  CONSTRAINT `sugerencias_incremento_credito_aprobada_por_usuario_id_foreign` FOREIGN KEY (`aprobada_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `sugerencias_incremento_credito_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `sugerencias_incremento_credito_rechazada_por_usuario_id_foreign` FOREIGN KEY (`rechazada_por_usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_rol` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `rol_id` bigint(20) unsigned NOT NULL,
  `sucursal_id` bigint(20) unsigned DEFAULT NULL,
  `asignado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `revocado_en` timestamp NULL DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `usuario_rol_usuario_id_index` (`usuario_id`),
  KEY `usuario_rol_rol_id_index` (`rol_id`),
  KEY `usuario_rol_sucursal_id_index` (`sucursal_id`),
  CONSTRAINT `usuario_rol_rol_id_foreign` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `usuario_rol_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`),
  CONSTRAINT `usuario_rol_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint(20) unsigned NOT NULL,
  `nombre_usuario` varchar(80) NOT NULL,
  `clave_hash` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `requiere_vpn` tinyint(1) NOT NULL DEFAULT 0,
  `canal_login` enum('WEB','VPN_WEB','MOVIL') NOT NULL DEFAULT 'WEB',
  `remember_token` varchar(100) DEFAULT NULL,
  `ultimo_acceso_en` timestamp NULL DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_persona_id_unique` (`persona_id`),
  UNIQUE KEY `usuarios_nombre_usuario_unique` (`nombre_usuario`),
  CONSTRAINT `usuarios_persona_id_foreign` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `numero_vale` varchar(50) NOT NULL,
  `distribuidora_id` bigint(20) unsigned NOT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `producto_financiero_id` bigint(20) unsigned NOT NULL,
  `sucursal_id` bigint(20) unsigned NOT NULL,
  `creado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `aprobado_por_usuario_id` bigint(20) unsigned DEFAULT NULL,
  `estado` enum('BORRADOR','APROBADO','TRANSFERIDO','ACTIVO','PAGO_PARCIAL','PAGADO','LIQUIDADO','MOROSO','RECLAMADO','CANCELADO','REVERSADO') NOT NULL DEFAULT 'BORRADOR',
  `monto` decimal(12,2) NOT NULL,
  `porcentaje_comision_empresa_snap` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `monto_comision_empresa` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_seguro_snap` decimal(12,2) NOT NULL DEFAULT 0.00,
  `porcentaje_interes_snap` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `monto_interes` decimal(12,2) NOT NULL DEFAULT 0.00,
  `porcentaje_ganancia_dist_snap` decimal(8,4) NOT NULL DEFAULT 0.0000,
  `monto_ganancia_distribuidora` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_multa_snap` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_total_deuda` decimal(12,2) NOT NULL,
  `monto_quincenal` decimal(12,2) NOT NULL,
  `quincenas_totales` int(11) NOT NULL,
  `pagos_realizados` int(11) NOT NULL DEFAULT 0,
  `saldo_actual` decimal(12,2) NOT NULL,
  `referencia_transferencia` varchar(100) DEFAULT NULL,
  `fecha_emision` datetime DEFAULT NULL,
  `fecha_transferencia` datetime DEFAULT NULL,
  `fecha_limite_pago` date DEFAULT NULL,
  `fecha_inicio_pago_anticipado` date DEFAULT NULL,
  `fecha_fin_pago_anticipado` date DEFAULT NULL,
  `motivo_reclamo` text DEFAULT NULL,
  `cancelado` tinyint(1) NOT NULL DEFAULT 0,
  `cancelado_en` datetime DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `vales_numero_vale_unique` (`numero_vale`),
  KEY `vales_producto_financiero_id_foreign` (`producto_financiero_id`),
  KEY `vales_creado_por_usuario_id_foreign` (`creado_por_usuario_id`),
  KEY `vales_aprobado_por_usuario_id_foreign` (`aprobado_por_usuario_id`),
  KEY `vales_distribuidora_id_index` (`distribuidora_id`),
  KEY `vales_cliente_id_index` (`cliente_id`),
  KEY `vales_estado_index` (`estado`),
  KEY `vales_dist_estado_idx` (`distribuidora_id`,`estado`),
  KEY `vales_dist_cliente_estado_idx` (`distribuidora_id`,`cliente_id`,`estado`),
  KEY `vales_dist_emision_id_idx` (`distribuidora_id`,`fecha_emision`,`id`),
  KEY `vales_dist_limite_emision_idx` (`distribuidora_id`,`fecha_limite_pago`,`fecha_emision`),
  KEY `vales_sucursal_estado_idx` (`sucursal_id`,`estado`),
  CONSTRAINT `vales_aprobado_por_usuario_id_foreign` FOREIGN KEY (`aprobado_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `vales_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `vales_creado_por_usuario_id_foreign` FOREIGN KEY (`creado_por_usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `vales_distribuidora_id_foreign` FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidoras` (`id`),
  CONSTRAINT `vales_producto_financiero_id_foreign` FOREIGN KEY (`producto_financiero_id`) REFERENCES `productos_financieros` (`id`),
  CONSTRAINT `vales_sucursal_id_foreign` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verificaciones_solicitud` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `solicitud_id` bigint(20) unsigned NOT NULL,
  `verificador_usuario_id` bigint(20) unsigned NOT NULL,
  `resultado` enum('PENDIENTE','VERIFICADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` text DEFAULT NULL,
  `latitud_verificacion` decimal(10,7) DEFAULT NULL,
  `longitud_verificacion` decimal(11,8) DEFAULT NULL,
  `fecha_visita` datetime DEFAULT NULL,
  `checklist_json` longtext DEFAULT NULL,
  `justificaciones_json` longtext DEFAULT NULL,
  `foto_fachada` varchar(255) DEFAULT NULL,
  `foto_ine_con_persona` varchar(255) DEFAULT NULL,
  `foto_comprobante` varchar(255) DEFAULT NULL,
  `evidencias_extras_json` longtext DEFAULT NULL,
  `distancia_metros` decimal(10,2) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `verificaciones_solicitud_solicitud_id_unique` (`solicitud_id`),
  KEY `verificaciones_solicitud_verificador_usuario_id_index` (`verificador_usuario_id`),
  KEY `verificaciones_solicitud_resultado_index` (`resultado`),
  KEY `verificaciones_solicitud_fecha_visita_index` (`fecha_visita`),
  CONSTRAINT `verificaciones_solicitud_solicitud_id_foreign` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `verificaciones_solicitud_verificador_usuario_id_foreign` FOREIGN KEY (`verificador_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

