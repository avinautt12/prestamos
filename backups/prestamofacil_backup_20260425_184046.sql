-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: prestamofacil
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activaciones_distribuidora`
--

DROP TABLE IF EXISTS `activaciones_distribuidora`;
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

--
-- Dumping data for table `activaciones_distribuidora`
--

LOCK TABLES `activaciones_distribuidora` WRITE;
/*!40000 ALTER TABLE `activaciones_distribuidora` DISABLE KEYS */;
/*!40000 ALTER TABLE `activaciones_distribuidora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_configuracion_sucursal`
--

DROP TABLE IF EXISTS `bitacora_configuracion_sucursal`;
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

--
-- Dumping data for table `bitacora_configuracion_sucursal`
--

LOCK TABLES `bitacora_configuracion_sucursal` WRITE;
/*!40000 ALTER TABLE `bitacora_configuracion_sucursal` DISABLE KEYS */;
INSERT INTO `bitacora_configuracion_sucursal` VALUES (1,1,1,2,'SUCURSAL',NULL,'{\"linea_credito_default\":30000,\"hora_corte\":\"17:00:00\"}','{\"linea_credito_default\":50000,\"hora_corte\":\"18:00:00\"}','2026-04-12 09:57:22','2026-04-12 09:57:22'),(2,2,2,2,'SUCURSAL',NULL,'{\"linea_credito_default\":30000,\"hora_corte\":\"17:00:00\"}','{\"linea_credito_default\":40000,\"hora_corte\":\"17:00:00\"}','2026-04-13 09:57:22','2026-04-13 09:57:22'),(3,1,1,2,'CATEGORIA',NULL,'{\"codigo\":\"PLATA\",\"porcentaje_comision\":5}','{\"codigo\":\"PLATA\",\"porcentaje_comision\":6}','2026-04-17 09:57:22','2026-04-17 09:57:22'),(4,1,1,2,'PRODUCTO',NULL,'{\"codigo\":\"PRESTAMO-8\\/12\",\"porcentaje_interes_quincenal\":2}','{\"codigo\":\"PRESTAMO-8\\/12\",\"porcentaje_interes_quincenal\":1.8}','2026-04-18 09:57:22','2026-04-18 09:57:22');
/*!40000 ALTER TABLE `bitacora_configuracion_sucursal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora_decisiones_gerente`
--

DROP TABLE IF EXISTS `bitacora_decisiones_gerente`;
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

--
-- Dumping data for table `bitacora_decisiones_gerente`
--

LOCK TABLES `bitacora_decisiones_gerente` WRITE;
/*!40000 ALTER TABLE `bitacora_decisiones_gerente` DISABLE KEYS */;
INSERT INTO `bitacora_decisiones_gerente` VALUES (1,2,1,NULL,'APROBACION',0.00,15000.00,'2026-04-15 09:57:22','2026-04-15 09:57:22'),(2,2,1,1,'NUEVA_DISTRIBUIDORA',0.00,50000.00,'2026-03-23 09:57:22','2026-03-23 09:57:22'),(3,2,1,1,'INCREMENTO_LIMITE',30000.00,50000.00,'2026-04-07 09:57:22','2026-04-07 09:57:22');
/*!40000 ALTER TABLE `bitacora_decisiones_gerente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_distribuidora`
--

DROP TABLE IF EXISTS `categorias_distribuidora`;
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

--
-- Dumping data for table `categorias_distribuidora`
--

LOCK TABLES `categorias_distribuidora` WRITE;
/*!40000 ALTER TABLE `categorias_distribuidora` DISABLE KEYS */;
INSERT INTO `categorias_distribuidora` VALUES (1,'COBRE','Cobre',4.0000,2,25.0000,1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(2,'PLATA','Plata',7.5000,3,20.0000,1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(3,'ORO','Oro',11.0000,4,15.0000,1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(4,'DIAMANTE','Diamante',13.5000,5,10.0000,1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL);
/*!40000 ALTER TABLE `categorias_distribuidora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
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

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,24,'CLI-COMP-001','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000001','Sofia Jimenez Cruz','2026-04-22 09:57:21','2026-04-22 09:57:21'),(2,25,'CLI-COMP-002','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000002','Luis Hernandez Peralta','2026-04-22 09:57:21','2026-04-22 09:57:21'),(3,26,'CLI-COMP-003','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000003','Maria Elena Rodriguez Sanchez','2026-04-22 09:57:22','2026-04-22 09:57:22'),(4,27,'CLI-COMP-004','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000004','Carlos Ramirez Lopez','2026-04-22 09:57:22','2026-04-22 09:57:22'),(5,28,'CLI-COMP-005','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000005','Laura Patricia Gomez Torres','2026-04-22 09:57:22','2026-04-22 09:57:22'),(6,29,'CLI-COMP-006','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000006','Jose Villarreal Nava','2026-04-22 09:57:22','2026-04-22 09:57:22'),(7,30,'CLI-COMP-007','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000007','Ana Cortez Robles','2026-04-22 09:57:22','2026-04-22 09:57:22'),(8,31,'CLI-COMP-008','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000008','Pedro Aguilar Soto','2026-04-22 09:57:22','2026-04-22 09:57:22'),(9,32,'CLI-COMP-009','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000009','Gabriela Moreno Serna','2026-04-22 09:57:22','2026-04-22 09:57:22'),(10,33,'CLI-COMP-010','ACTIVO',NULL,'clientes/demo/ine_frente.jpg','clientes/demo/ine_reverso.jpg','clientes/demo/selfie.jpg','BBVA','012180000000000010','Rafael Castro Aguirre','2026-04-22 09:57:22','2026-04-22 09:57:22');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes_distribuidora`
--

DROP TABLE IF EXISTS `clientes_distribuidora`;
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

--
-- Dumping data for table `clientes_distribuidora`
--

LOCK TABLES `clientes_distribuidora` WRITE;
/*!40000 ALTER TABLE `clientes_distribuidora` DISABLE KEYS */;
INSERT INTO `clientes_distribuidora` VALUES (1,1,1,'ACTIVA',1,0,NULL,'2026-02-21 09:57:21',NULL),(2,1,2,'ACTIVA',1,0,NULL,'2026-02-21 09:57:21',NULL),(3,1,3,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(4,2,4,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(5,2,5,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(6,3,6,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(7,3,7,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(8,3,8,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(9,4,9,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL),(10,4,10,'ACTIVA',1,0,NULL,'2026-02-21 09:57:22',NULL);
/*!40000 ALTER TABLE `clientes_distribuidora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conciliaciones`
--

DROP TABLE IF EXISTS `conciliaciones`;
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

--
-- Dumping data for table `conciliaciones`
--

LOCK TABLES `conciliaciones` WRITE;
/*!40000 ALTER TABLE `conciliaciones` DISABLE KEYS */;
INSERT INTO `conciliaciones` VALUES (1,1,1,7,'2026-03-28 09:57:22',2453.00,0.00,'CONCILIADA','Match automático por referencia.');
/*!40000 ALTER TABLE `conciliaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cortes`
--

DROP TABLE IF EXISTS `cortes`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cortes`
--

LOCK TABLES `cortes` WRITE;
/*!40000 ALTER TABLE `cortes` DISABLE KEYS */;
INSERT INTO `cortes` VALUES (1,1,'PAGOS',14,'18:00:00','2026-03-23 03:57:22','2026-03-23 03:57:22',0,'CERRADO','Corte histórico cerrado con todas las relaciones pagadas.','2026-03-23 09:57:22','2026-03-28 09:57:22'),(2,1,'PAGOS',14,'18:00:00','2026-04-20 03:57:22','2026-04-20 03:57:22',0,'EJECUTADO','Corte ejecutado pendiente de cobranza.','2026-04-20 09:57:22','2026-04-20 09:57:22');
/*!40000 ALTER TABLE `cortes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_bancarias`
--

DROP TABLE IF EXISTS `cuentas_bancarias`;
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

--
-- Dumping data for table `cuentas_bancarias`
--

LOCK TABLES `cuentas_bancarias` WRITE;
/*!40000 ALTER TABLE `cuentas_bancarias` DISABLE KEYS */;
INSERT INTO `cuentas_bancarias` VALUES (1,'DISTRIBUIDORA',1,'BBVA','Abarrotes Martinez Ortega','****1000','046090000000001000',NULL,'PFDIST001-C',1,'2026-04-22 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(2,'DISTRIBUIDORA',2,'BBVA','Deposito Garcia Reyes','****1001','046090000000001001',NULL,'PFDIST002-C',1,'2026-04-22 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(3,'DISTRIBUIDORA',3,'BBVA','Tiendita Lopez Cantu','****1002','046090000000001002',NULL,'PFDIST001-N',1,'2026-04-22 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(4,'DISTRIBUIDORA',4,'BBVA','Bodega Ramirez Solis','****1003','046090000000001003',NULL,'PFDIST002-N',1,'2026-04-22 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(5,'EMPRESA',1,'BBVA','Prestamo Facil SA de CV','****7890','012180000123457890','CIE1234','SUC-TRC-CENTRO',1,'2025-04-22 09:57:22','2026-04-22 09:57:22','2026-04-22 09:57:22');
/*!40000 ALTER TABLE `cuentas_bancarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distribuidoras`
--

DROP TABLE IF EXISTS `distribuidoras`;
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

--
-- Dumping data for table `distribuidoras`
--

LOCK TABLES `distribuidoras` WRITE;
/*!40000 ALTER TABLE `distribuidoras` DISABLE KEYS */;
INSERT INTO `distribuidoras` VALUES (1,20,1,1,3,1,1,'PFDIST001-C','ACTIVA',50000.00,50000.00,0,0.00,1,0,'2026-03-23 09:57:21',NULL,'2026-04-22 03:57:21','2026-04-22 03:57:59'),(2,21,2,1,3,2,2,'PFDIST002-C','ACTIVA',80000.00,80000.00,0,30.00,1,0,'2026-03-23 09:57:21',NULL,'2026-04-22 03:57:21','2026-04-22 03:57:22'),(3,22,4,2,9,1,3,'PFDIST001-N','ACTIVA',40000.00,40000.00,0,60.00,1,0,'2026-03-23 09:57:21',NULL,'2026-04-22 03:57:21','2026-04-22 03:57:22'),(4,23,5,2,9,2,4,'PFDIST002-N','ACTIVA',70000.00,70000.00,0,50.00,1,0,'2026-03-23 09:57:21',NULL,'2026-04-22 03:57:21','2026-04-22 03:57:22'),(5,19,6,2,9,1,NULL,'PFDIST003-N','CANDIDATA',0.00,0.00,0,0.00,0,0,NULL,NULL,'2026-04-22 03:57:21','2026-04-22 03:57:21');
/*!40000 ALTER TABLE `distribuidoras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egresos_empresa_simulados`
--

DROP TABLE IF EXISTS `egresos_empresa_simulados`;
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

--
-- Dumping data for table `egresos_empresa_simulados`
--

LOCK TABLES `egresos_empresa_simulados` WRITE;
/*!40000 ALTER TABLE `egresos_empresa_simulados` DISABLE KEYS */;
/*!40000 ALTER TABLE `egresos_empresa_simulados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_credito_score`
--

DROP TABLE IF EXISTS `historial_credito_score`;
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

--
-- Dumping data for table `historial_credito_score`
--

LOCK TABLES `historial_credito_score` WRITE;
/*!40000 ALTER TABLE `historial_credito_score` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_credito_score` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2019_12_14_000001_create_personal_access_tokens_table',1),(2,'2026_04_01_172759_create_personas_table',1),(3,'2026_04_01_172800_create_usuarios_table',1),(4,'2026_04_01_172802_create_roles_table',1),(5,'2026_04_01_172803_create_sucursales_table',1),(6,'2026_04_01_172804_create_usuario_rol_table',1),(7,'2026_04_01_172805_create_cuentas_bancarias_table',1),(8,'2026_04_01_172806_create_categorias_distribuidora_table',1),(9,'2026_04_01_172807_create_productos_financieros_table',1),(10,'2026_04_01_172808_create_solicitudes_table',1),(11,'2026_04_01_172810_create_distribuidoras_table',1),(12,'2026_04_01_172811_create_clientes_table',1),(13,'2026_04_01_172812_create_clientes_distribuidora_table',1),(14,'2026_04_01_172813_create_cortes_table',1),(15,'2026_04_01_172814_create_vales_table',1),(16,'2026_04_01_172815_create_pagos_cliente_table',1),(17,'2026_04_01_172817_create_relaciones_corte_table',1),(18,'2026_04_01_172818_create_partidas_relacion_corte_table',1),(19,'2026_04_01_172819_create_pagos_distribuidora_table',1),(20,'2026_04_01_172820_create_movimientos_bancarios_table',1),(21,'2026_04_01_172822_create_conciliaciones_table',1),(22,'2026_04_01_172823_create_movimientos_puntos_table',1),(23,'2026_04_03_150753_create_verificaciones_solicitud_table',1),(24,'2026_04_03_230000_create_password_reset_tokens_table',1),(25,'2026_04_03_235500_create_bitacora_decisiones_gerente_table',1),(26,'2026_04_06_120000_create_sucursal_configuraciones_table',1),(27,'2026_04_06_130000_create_bitacora_configuracion_sucursal_table',1),(28,'2026_04_06_131000_add_motivo_rechazo_to_solicitudes_table',1),(29,'2026_04_07_201500_add_soft_deletes_to_catalog_tables',1),(30,'2026_04_07_235500_add_rechazo_to_bitacora_decisiones_enum',1),(31,'2026_04_08_060000_move_monto_principal_from_vales_to_productos_financieros_table',1),(32,'2026_04_08_180238_add_en_verificacion_to_clientes_estado',1),(33,'2026_04_08_193308_add_fotos_y_cuenta_bancaria_to_clientes',1),(34,'2026_04_08_201500_add_unique_indexes_to_conciliaciones_table',1),(35,'2026_04_09_120000_create_notifications_table',1),(36,'2026_04_10_220000_create_egresos_empresa_simulados_table',1),(37,'2026_04_10_223000_add_performance_indexes_core_tables',1),(38,'2026_04_10_224500_add_deleted_at_to_productos_financieros_table',1),(39,'2026_04_11_130000_add_missing_constraints',1),(40,'2026_04_13_230000_create_activaciones_distribuidora_table',1),(41,'2026_04_14_180000_create_solicitudes_traspaso_cliente_table',1),(42,'2026_04_14_200000_create_puntos_conf_table',1),(43,'2026_04_14_210000_drop_valor_punto_from_categorias_distribuidora',1),(44,'2026_04_14_220000_drop_puntos_columnas_de_sucursal_configuraciones',1),(45,'2026_04_15_000001_add_prevale_aprobado_to_clientes_distribuidora_table',1),(46,'2026_04_16_003830_add_desglose_vales_to_pagos_distribuidora',1),(47,'2026_04_18_090000_add_reversion_to_pagos_cliente',1),(48,'2026_04_19_120000_rename_vale_pagado_to_liquidado',1),(49,'2026_04_19_130000_add_pagado_back_to_vale_estado',1),(50,'2026_04_21_000000_create_historial_credito_score_table',1),(51,'2026_04_21_000001_create_sugerencias_incremento_credito_table',1),(52,'2026_04_21_000002_add_credito_auto_to_sucursal_configuraciones',1),(53,'2026_04_21_000003_add_tipo_evento_incremento_manual',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_bancarios`
--

DROP TABLE IF EXISTS `movimientos_bancarios`;
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

--
-- Dumping data for table `movimientos_bancarios`
--

LOCK TABLES `movimientos_bancarios` WRITE;
/*!40000 ALTER TABLE `movimientos_bancarios` DISABLE KEYS */;
INSERT INTO `movimientos_bancarios` VALUES (1,5,'PFCEN001-A','2026-03-28','10:15:00',2453.00,'DEPOSITO','FOL-F878D07F','Abarrotes Martinez','Pago relación REL-COMP-001','2026-03-28 09:57:22');
/*!40000 ALTER TABLE `movimientos_bancarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_puntos`
--

DROP TABLE IF EXISTS `movimientos_puntos`;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_puntos`
--

LOCK TABLES `movimientos_puntos` WRITE;
/*!40000 ALTER TABLE `movimientos_puntos` DISABLE KEYS */;
INSERT INTO `movimientos_puntos` VALUES (1,1,2,1,NULL,'GANADO_ANTICIPADO',30.00,2.00,'Pago anticipado del corte 1','2026-04-22 03:57:22','2026-03-28 09:57:22'),(2,1,2,1,NULL,'GANADO_PUNTUAL',15.00,2.00,'Pago puntual del corte 1','2026-04-22 03:57:22','2026-03-28 09:57:22'),(3,2,NULL,NULL,NULL,'AJUSTE_MANUAL',30.00,2.00,'Ajuste inicial de puntos para pruebas','2026-04-22 03:57:22','2026-04-02 09:57:22'),(4,3,NULL,NULL,NULL,'AJUSTE_MANUAL',60.00,2.00,'Ajuste inicial de puntos para pruebas','2026-04-22 03:57:22','2026-04-02 09:57:22'),(5,4,NULL,NULL,NULL,'AJUSTE_MANUAL',50.00,2.00,'Ajuste inicial de puntos para pruebas','2026-04-22 03:57:22','2026-04-02 09:57:22'),(6,1,NULL,2,NULL,'CANJE',-45.00,2.00,'Canje aplicado a REL-COMP-002 (-$90)','2026-04-22 03:57:59','2026-04-22 03:57:59');
/*!40000 ALTER TABLE `movimientos_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
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

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('461cce2d-55ff-498e-abd3-22880a0ad0f0','App\\Notifications\\DistribuidoraOperacionNotification','App\\Models\\User',14,'{\"tipo\":\"PUNTOS_CANJE_APLICADO\",\"titulo\":\"Canje de puntos aplicado\",\"mensaje\":\"Se aplicaron 45 puntos (-$90.00) a la relaci\\u00f3n REL-COMP-002.\",\"timestamp\":\"2026-04-22T03:58:00+00:00\",\"distribuidora_id\":1,\"numero_distribuidora\":\"PFDIST001-C\",\"relacion_corte_id\":2,\"numero_relacion\":\"REL-COMP-002\",\"puntos_canjeados\":45,\"valor_aplicado\":90}',NULL,'2026-04-22 09:58:00','2026-04-22 09:58:00');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_cliente`
--

DROP TABLE IF EXISTS `pagos_cliente`;
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

--
-- Dumping data for table `pagos_cliente`
--

LOCK TABLES `pagos_cliente` WRITE;
/*!40000 ALTER TABLE `pagos_cliente` DISABLE KEYS */;
INSERT INTO `pagos_cliente` VALUES (1,2,2,1,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(2,2,2,1,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(3,2,2,1,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(4,2,2,1,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(5,2,2,1,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(6,2,2,1,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(7,2,2,1,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(8,2,2,1,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22'),(9,3,3,1,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(10,3,3,1,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(11,3,3,1,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(12,3,3,1,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(13,3,3,1,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(14,3,3,1,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(15,3,3,1,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(16,3,3,1,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22'),(17,5,5,2,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(18,5,5,2,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(19,5,5,2,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(20,5,5,2,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(21,5,5,2,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(22,5,5,2,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(23,5,5,2,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(24,5,5,2,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22'),(25,7,7,3,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(26,7,7,3,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(27,7,7,3,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(28,7,7,3,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(29,7,7,3,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(30,7,7,3,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(31,7,7,3,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(32,7,7,3,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22'),(33,8,8,3,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(34,8,8,3,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(35,8,8,3,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(36,8,8,3,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(37,8,8,3,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(38,8,8,3,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(39,8,8,3,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(40,8,8,3,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22'),(41,10,10,4,NULL,'2025-11-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-08 09:57:22'),(42,10,10,4,NULL,'2025-11-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-11-23 09:57:22'),(43,10,10,4,NULL,'2025-12-08 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-08 09:57:22'),(44,10,10,4,NULL,'2025-12-23 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2025-12-23 09:57:22'),(45,10,10,4,NULL,'2026-01-07 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-07 09:57:22'),(46,10,10,4,NULL,'2026-01-22 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-01-22 09:57:22'),(47,10,10,4,NULL,'2026-02-06 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-06 09:57:22'),(48,10,10,4,NULL,'2026-02-21 03:57:22',1829.00,'EFECTIVO',0,1,'Pago generado por seeder (vale liquidado)',NULL,NULL,NULL,'2026-02-21 09:57:22');
/*!40000 ALTER TABLE `pagos_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_distribuidora`
--

DROP TABLE IF EXISTS `pagos_distribuidora`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_distribuidora`
--

LOCK TABLES `pagos_distribuidora` WRITE;
/*!40000 ALTER TABLE `pagos_distribuidora` DISABLE KEYS */;
INSERT INTO `pagos_distribuidora` VALUES (1,1,1,5,2453.00,'TRANSFERENCIA','PFCEN001-A','2026-03-28 03:57:22','CONCILIADO','Pago conciliado automáticamente contra archivo bancario.',NULL,0,'2026-03-28 09:57:22'),(2,2,1,NULL,2363.00,'TRANSFERENCIA','PFCEN001-B','2026-04-22 03:58:15','REPORTADO','Reportado por la distribuidora','[]',0,'2026-04-22 03:58:15');
/*!40000 ALTER TABLE `pagos_distribuidora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partidas_relacion_corte`
--

DROP TABLE IF EXISTS `partidas_relacion_corte`;
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

--
-- Dumping data for table `partidas_relacion_corte`
--

LOCK TABLES `partidas_relacion_corte` WRITE;
/*!40000 ALTER TABLE `partidas_relacion_corte` DISABLE KEYS */;
INSERT INTO `partidas_relacion_corte` VALUES (1,1,2,2,'Prestamo 8/12000',8,8,624.00,1829.00,0.00,2453.00,'2026-03-23 09:57:22'),(2,2,1,1,'Prestamo 8/12000',0,8,624.00,1829.00,0.00,2453.00,'2026-04-20 09:57:22');
/*!40000 ALTER TABLE `partidas_relacion_corte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
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

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
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

--
-- Dumping data for table `personas`
--

LOCK TABLES `personas` WRITE;
/*!40000 ALTER TABLE `personas` DISABLE KEYS */;
INSERT INTO `personas` VALUES (1,'Admin',NULL,'Sistema','Prestamofacil','M','1980-01-01','SIPA800101HCLRRD00','SIPA800101000',NULL,'8711000000','admin@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(2,'Ricardo',NULL,'Martinez','Lopez','M','1978-03-15','MALR780315HCLRPC01','MALR780315A31',NULL,'8711100001','gerente@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(3,'Miguel',NULL,'Hernandez','Soto','M','1985-05-10','HESM850510HCLRTG04','HESM850510D14',NULL,'8711200001','coordinador@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(4,'Carlos',NULL,'Flores','Diaz','M','1990-02-14','FODC900214HCLLZR07','FODC900214G77',NULL,'8711300001','verificador@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(5,'Andrea',NULL,'Medina','Salas','F','1992-06-28','MESA920628MCLDLN08','MESA920628H98',NULL,'8711300002','verif2.trc_centro@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(6,'Oscar',NULL,'Hinojosa','Villanueva','M','1991-11-09','HIVO911109HCLHLL16','HIVO911109Q16',NULL,'8711300003','verif3.trc_centro@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(7,'Claudia',NULL,'Ruiz','Mendoza','F','1986-11-25','RUMC861125MCLZNL13','RUMC861125M93',NULL,'8711400001','cajera@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(8,'Patricia',NULL,'Gonzalez','Fuentes','F','1982-07-22','GOFP820722MCLNNT02','GOFP820722B52',NULL,'8711100002','gerente.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(9,'Laura',NULL,'Vazquez','Morales','F','1988-09-05','VAML880905MCLZRR05','VAML880905E35',NULL,'8711200002','coord.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(10,'Sergio',NULL,'Ortega','Garcia','M','1987-04-03','OEGS870403HCLRRC09','OEGS870403I19',NULL,'8711300004','verif1.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20'),(11,'Brenda',NULL,'Reyes','Jimenez','F','1993-08-21','REJB930821MCLYMR10','REJB930821J30',NULL,'8711300005','verif2.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(12,'Raul',NULL,'Delgado','Escobedo','M','1989-12-02','DEER891202HCLLSC17','DEER891202R17',NULL,'8711300006','verif3.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(13,'Veronica',NULL,'Cortes','Romero','F','1991-03-19','CORV910319MCLRMR14','CORV910319N14',NULL,'8711400002','cajera.trc_nte@prestamofacil.test',NULL,NULL,NULL,'Torreon','Coahuila','27000',NULL,NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(14,'Abarrotes',NULL,'Martinez','Ortega','F','1990-01-01','MAOA900101FCLXXXXS','MAOA90010101A',NULL,'8715000001','abarrotes.martinez@clientes.test','Calle Abarrotes','241','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(15,'Deposito',NULL,'Garcia','Reyes','M','1990-01-01','GARD900101MCLXXXXS','GARD900101BFB',NULL,'8715000002','deposito.garcia@clientes.test','Calle Deposito','986','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(16,'Diana',NULL,'Salazar','Jaramillo','F','1990-01-01','SAJD900101FCLXXXXS','SAJD900101AAE',NULL,'8715000003','diana.salazar@clientes.test','Calle Diana','410','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(17,'Tiendita',NULL,'Lopez','Cantu','F','1990-01-01','LOCT900101FCLXXXXS','LOCT9001019ED',NULL,'8715000004','tiendita.lopez@clientes.test','Calle Tiendita','128','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(18,'Bodega',NULL,'Ramirez','Solis','M','1990-01-01','RASB900101MCLXXXXS','RASB90010148C',NULL,'8715000005','bodega.ramirez@clientes.test','Calle Bodega','756','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(19,'Enrique',NULL,'Tovar','Kessler','M','1990-01-01','TOKE900101MCLXXXXS','TOKE900101859',NULL,'8715000006','enrique.tovar@clientes.test','Calle Enrique','885','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(20,'Abarrotes',NULL,'Martinez','Ortega','F','1985-01-01','MAOA850101FCLDIST2','MAOA850101C01',NULL,'8716000010','distribuidora@distribuidoras.test','Av. Comercio','100','Industrial','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(21,'Deposito',NULL,'Garcia','Reyes','M','1985-01-01','GARD850101MCLDIST2','GARD8501010F3',NULL,'8716000011','dist2.trc_centro@distribuidoras.test','Av. Comercio','101','Industrial','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(22,'Tiendita',NULL,'Lopez','Cantu','F','1985-01-01','LOCT850101FCLDIST2','LOCT8501013D5',NULL,'8716000012','dist1.trc_nte@distribuidoras.test','Av. Comercio','102','Industrial','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(23,'Bodega',NULL,'Ramirez','Solis','M','1985-01-01','RASB850101MCLDIST2','RASB850101419',NULL,'8716000013','dist2.trc_nte@distribuidoras.test','Av. Comercio','103','Industrial','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(24,'Sofia',NULL,'Jimenez','Cruz','F','1992-01-01','JICS920101FCLCLIE0','JICS9201016DF',NULL,'8717000001','sofia.jimenez@clientes.test','Calle Sofia','6437','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(25,'Luis',NULL,'Hernandez','Peralta','M','1992-01-01','HEPL920101MCLCLIE0','HEPL92010182A',NULL,'8717000002','luis.hernandez@clientes.test','Calle Luis','5321','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(26,'Maria Elena',NULL,'Rodriguez','Sanchez','F','1992-01-01','ROSM920101FCLCLIE0','ROSM9201019FF',NULL,'8717000003','mariaelena.rodriguez@clientes.test','Calle Maria Elena','2607','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(27,'Carlos',NULL,'Ramirez','Lopez','M','1992-01-01','RALC920101MCLCLIE0','RALC920101DE5',NULL,'8717000004','carlos.ramirez@clientes.test','Calle Carlos','3769','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(28,'Laura Patricia',NULL,'Gomez','Torres','F','1992-01-01','GOTL920101FCLCLIE0','GOTL920101EB9',NULL,'8717000005','laurapatricia.gomez@clientes.test','Calle Laura Patricia','3030','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(29,'Jose',NULL,'Villarreal','Nava','M','1992-01-01','VINJ920101MCLCLIE0','VINJ9201014DE',NULL,'8717000006','jose.villarreal@clientes.test','Calle Jose','544','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(30,'Ana',NULL,'Cortez','Robles','F','1992-01-01','CORA920101FCLCLIE0','CORA92010172D',NULL,'8717000007','ana.cortez@clientes.test','Calle Ana','2970','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(31,'Pedro',NULL,'Aguilar','Soto','M','1992-01-01','AGSP920101MCLCLIE0','AGSP9201014FF',NULL,'8717000008','pedro.aguilar@clientes.test','Calle Pedro','948','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(32,'Gabriela',NULL,'Moreno','Serna','F','1992-01-01','MOSG920101FCLCLIE0','MOSG92010114E',NULL,'8717000009','gabriela.moreno@clientes.test','Calle Gabriela','4787','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(33,'Rafael',NULL,'Castro','Aguirre','M','1992-01-01','CAAR920101MCLCLIE0','CAAR9201017EE',NULL,'8717000010','rafael.castro@clientes.test','Calle Rafael','5858','Centro','Torreon','Coahuila','27000',25.5428000,-103.4068000,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22');
/*!40000 ALTER TABLE `personas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos_financieros`
--

DROP TABLE IF EXISTS `productos_financieros`;
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

--
-- Dumping data for table `productos_financieros`
--

LOCK TABLES `productos_financieros` WRITE;
/*!40000 ALTER TABLE `productos_financieros` DISABLE KEYS */;
INSERT INTO `productos_financieros` VALUES (1,'PRESTAMO-4/8','Prestamo 4/8','4 quincenas, $8,000 MXN',8000.00,4,5.5000,180.00,2.1000,200.00,'TRANSFERENCIA',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(2,'PRESTAMO-8/12','Prestamo 8/12','8 quincenas, $12,000 MXN',12000.00,8,5.2000,280.00,1.8000,250.00,'TRANSFERENCIA',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(3,'PRESTAMO-10/15','Prestamo 10/15','10 quincenas, $15,000 MXN',15000.00,10,5.0000,360.00,1.7000,280.00,'TRANSFERENCIA',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(4,'PRESTAMO-12/18','Prestamo 12/18','12 quincenas, $18,000 MXN',18000.00,12,4.8000,420.00,1.5000,300.00,'TRANSFERENCIA',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(5,'PRESTAMO-18/24','Prestamo 18/24','18 quincenas, $24,000 MXN',24000.00,18,4.5000,500.00,1.3000,350.00,'MIXTO',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(6,'PRESTAMO-24/30','Prestamo 24/30','24 quincenas, $30,000 MXN',30000.00,24,4.2000,650.00,1.2000,400.00,'TRANSFERENCIA',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL);
/*!40000 ALTER TABLE `productos_financieros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `puntos_conf`
--

DROP TABLE IF EXISTS `puntos_conf`;
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

--
-- Dumping data for table `puntos_conf`
--

LOCK TABLES `puntos_conf` WRITE;
/*!40000 ALTER TABLE `puntos_conf` DISABLE KEYS */;
INSERT INTO `puntos_conf` VALUES (1,1200,3,2.00,20.0000,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20');
/*!40000 ALTER TABLE `puntos_conf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `relaciones_corte`
--

DROP TABLE IF EXISTS `relaciones_corte`;
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

--
-- Dumping data for table `relaciones_corte`
--

LOCK TABLES `relaciones_corte` WRITE;
/*!40000 ALTER TABLE `relaciones_corte` DISABLE KEYS */;
INSERT INTO `relaciones_corte` VALUES (1,1,1,'REL-COMP-001','PFCEN001-A','2026-04-02','2026-03-23','2026-03-26',50000.00,50000.00,0.00,624.00,1829.00,0.00,2453.00,'CERRADA','2026-03-23 09:57:22'),(2,2,1,'REL-COMP-002','PFCEN001-B','2026-05-05','2026-04-20','2026-04-23',50000.00,50000.00,45.00,624.00,1829.00,0.00,2363.00,'PAGADA','2026-04-20 09:57:22');
/*!40000 ALTER TABLE `relaciones_corte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
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

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'GERENTE','Gerente','Gerente de sucursal - Acceso a reportes y administración general',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(2,'COORDINADOR','Coordinador','Coordinador de distribuidoras - Registro y gestión de solicitudes',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(3,'VERIFICADOR','Verificador','Valida solicitudes y verifica información domiciliaria',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(4,'CAJERA','Cajera','Opera prevale y cobros, gestiona pagos',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(5,'DISTRIBUIDORA','Distribuidora','Distribuidora del sistema - Emisión de vales y gestión de puntos',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(6,'ADMIN','Administrador (Alias)','Alias temporal para compatibilidad con ambientes que referencian ADMIN',1,'2026-04-22 09:57:20','2026-04-22 03:57:20',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
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

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (1,14,1,3,3,4,NULL,'APROBADA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-03-14 09:57:21','2026-03-13 09:57:21','2026-03-15 09:57:21','2026-03-18 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(2,15,1,3,3,4,NULL,'APROBADA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-03-19 09:57:21','2026-03-18 09:57:21','2026-03-20 09:57:21','2026-03-23 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(3,16,1,3,3,4,NULL,'VERIFICADA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-04-19 09:57:21','2026-04-18 09:57:21','2026-04-20 09:57:21',NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21'),(4,17,2,9,9,10,NULL,'APROBADA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-03-09 09:57:21','2026-03-08 09:57:21','2026-03-10 09:57:21','2026-03-13 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(5,18,2,9,9,10,NULL,'APROBADA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-03-16 09:57:21','2026-03-15 09:57:21','2026-03-17 09:57:21','2026-03-20 09:57:21','2026-04-22 09:57:21','2026-04-22 09:57:21'),(6,19,2,9,9,10,NULL,'POSIBLE_DISTRIBUIDORA','COBRE','\"[{\\\"parentesco\\\":\\\"Conyuge\\\",\\\"nombre\\\":\\\"Familiar Prueba\\\",\\\"edad\\\":30}]\"','\"[{\\\"empresa\\\":\\\"Empresa Demo\\\",\\\"antiguedad_anios\\\":5,\\\"limite_credito\\\":10000}]\"','\"[{\\\"marca\\\":\\\"Nissan\\\",\\\"modelo\\\":\\\"Versa\\\",\\\"anio\\\":2018}]\"',15000.00,'solicitudes/demo/ine_frente.jpg','solicitudes/demo/ine_reverso.jpg','solicitudes/demo/comprobante.jpg','solicitudes/demo/buro.pdf','Apto / Buen historial',NULL,0,0,'2026-04-16 09:57:21','2026-04-15 09:57:21','2026-04-17 09:57:21',NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21');
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_traspaso_cliente`
--

DROP TABLE IF EXISTS `solicitudes_traspaso_cliente`;
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

--
-- Dumping data for table `solicitudes_traspaso_cliente`
--

LOCK TABLES `solicitudes_traspaso_cliente` WRITE;
/*!40000 ALTER TABLE `solicitudes_traspaso_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_traspaso_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sucursal_configuraciones`
--

DROP TABLE IF EXISTS `sucursal_configuraciones`;
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

--
-- Dumping data for table `sucursal_configuraciones`
--

LOCK TABLES `sucursal_configuraciones` WRITE;
/*!40000 ALTER TABLE `sucursal_configuraciones` DISABLE KEYS */;
INSERT INTO `sucursal_configuraciones` VALUES (1,1,14,'18:00:00',14,15,50000.00,NULL,10.0000,5.0000,300.00,NULL,70.00,NULL,NULL,NULL,'2026-04-22 03:57:20','2026-04-22 03:57:20'),(2,2,14,'17:00:00',14,15,40000.00,NULL,10.0000,5.0000,300.00,NULL,70.00,NULL,NULL,NULL,'2026-04-22 03:57:20','2026-04-22 03:57:20');
/*!40000 ALTER TABLE `sucursal_configuraciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sucursales`
--

DROP TABLE IF EXISTS `sucursales`;
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

--
-- Dumping data for table `sucursales`
--

LOCK TABLES `sucursales` WRITE;
/*!40000 ALTER TABLE `sucursales` DISABLE KEYS */;
INSERT INTO `sucursales` VALUES (1,'SUC-TRC-CENTRO','Sucursal Torreon Centro','Av. Hidalgo 450 Sur, Centro, Torreon, Coahuila, Mexico','8711000000',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(2,'SUC-TRC-NTE','Sucursal Torreon Norte','Blvd. Revolucion 1800 Nte, Col. Las Magdalenas, Torreon, Coahuila, Mexico','8711000001',1,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL);
/*!40000 ALTER TABLE `sucursales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sugerencias_incremento_credito`
--

DROP TABLE IF EXISTS `sugerencias_incremento_credito`;
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

--
-- Dumping data for table `sugerencias_incremento_credito`
--

LOCK TABLES `sugerencias_incremento_credito` WRITE;
/*!40000 ALTER TABLE `sugerencias_incremento_credito` DISABLE KEYS */;
/*!40000 ALTER TABLE `sugerencias_incremento_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_rol`
--

DROP TABLE IF EXISTS `usuario_rol`;
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

--
-- Dumping data for table `usuario_rol`
--

LOCK TABLES `usuario_rol` WRITE;
/*!40000 ALTER TABLE `usuario_rol` DISABLE KEYS */;
INSERT INTO `usuario_rol` VALUES (1,1,6,NULL,'2026-04-22 09:57:20',NULL,1),(2,2,1,1,'2026-04-22 09:57:20',NULL,1),(3,3,2,1,'2026-04-22 09:57:20',NULL,1),(4,4,3,1,'2026-04-22 09:57:20',NULL,1),(5,5,3,1,'2026-04-22 09:57:20',NULL,1),(6,6,3,1,'2026-04-22 09:57:20',NULL,1),(7,7,4,1,'2026-04-22 09:57:20',NULL,1),(8,8,1,2,'2026-04-22 09:57:20',NULL,1),(9,9,2,2,'2026-04-22 09:57:20',NULL,1),(10,10,3,2,'2026-04-22 09:57:21',NULL,1),(11,11,3,2,'2026-04-22 09:57:21',NULL,1),(12,12,3,2,'2026-04-22 09:57:21',NULL,1),(13,13,4,2,'2026-04-22 09:57:21',NULL,1),(14,14,5,1,'2026-04-22 09:57:21',NULL,1),(15,15,5,1,'2026-04-22 09:57:21',NULL,1),(16,16,5,2,'2026-04-22 09:57:21',NULL,1),(17,17,5,2,'2026-04-22 09:57:21',NULL,1),(18,18,5,2,'2026-04-22 09:57:21',NULL,1);
/*!40000 ALTER TABLE `usuario_rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
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

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'admin','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(2,2,'gerente','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(3,3,'coordinador','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(4,4,'verificador','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(5,5,'verif2.trc_centro','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(6,6,'verif3.trc_centro','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(7,7,'cajera','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(8,8,'gerente.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(9,9,'coord.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:20',NULL),(10,10,'verif1.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:20','2026-04-22 09:57:21',NULL),(11,11,'verif2.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(12,12,'verif3.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(13,13,'cajera.trc_nte','$2y$12$an3nR65FLySumMGf8vDaCOVSNP5hjvtBGa7f1O8mVkd2fLkyBE4bC',1,0,'WEB',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(14,20,'distribuidora','$2y$12$yumSNX6YiZP7Kvyjo0ZdBODgIj3sdVIAPiJLS.bnv/yq3.mBWr8UW',1,0,'MOVIL',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(15,21,'dist2.trc_centro','$2y$12$yumSNX6YiZP7Kvyjo0ZdBODgIj3sdVIAPiJLS.bnv/yq3.mBWr8UW',1,0,'MOVIL',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(16,22,'dist1.trc_nte','$2y$12$yumSNX6YiZP7Kvyjo0ZdBODgIj3sdVIAPiJLS.bnv/yq3.mBWr8UW',1,0,'MOVIL',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(17,23,'dist2.trc_nte','$2y$12$yumSNX6YiZP7Kvyjo0ZdBODgIj3sdVIAPiJLS.bnv/yq3.mBWr8UW',1,0,'MOVIL',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL),(18,19,'dist.candidata','$2y$12$yumSNX6YiZP7Kvyjo0ZdBODgIj3sdVIAPiJLS.bnv/yq3.mBWr8UW',1,0,'MOVIL',NULL,NULL,'2026-04-22 09:57:21','2026-04-22 09:57:21',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vales`
--

DROP TABLE IF EXISTS `vales`;
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

--
-- Dumping data for table `vales`
--

LOCK TABLES `vales` WRITE;
/*!40000 ALTER TABLE `vales` DISABLE KEYS */;
INSERT INTO `vales` VALUES (1,'VALE-260422-D687A2',1,1,2,1,14,7,'ACTIVO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,0,14632.00,NULL,'2026-04-15 03:57:22','2026-04-15 03:57:22','2026-08-13','2026-07-14','2026-08-13',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(2,'VALE-260422-0BDD2B',1,2,2,1,14,7,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(3,'VALE-260422-50A856',1,3,2,1,14,7,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(4,'VALE-260422-C64D90',2,4,2,1,15,7,'ACTIVO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,7.5000,900.00,250.00,14632.00,1829.00,8,0,14632.00,NULL,'2026-04-15 03:57:22','2026-04-15 03:57:22','2026-08-13','2026-07-14','2026-08-13',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(5,'VALE-260422-E7323B',2,5,2,1,15,7,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,7.5000,900.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(6,'VALE-260422-783A82',3,6,2,2,16,13,'ACTIVO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,0,14632.00,NULL,'2026-04-15 03:57:22','2026-04-15 03:57:22','2026-08-13','2026-07-14','2026-08-13',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(7,'VALE-260422-A87949',3,7,2,2,16,13,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(8,'VALE-260422-47BA61',3,8,2,2,16,13,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,4.0000,480.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(9,'VALE-260422-3522F2',4,9,2,2,17,13,'ACTIVO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,7.5000,900.00,250.00,14632.00,1829.00,8,0,14632.00,NULL,'2026-04-15 03:57:22','2026-04-15 03:57:22','2026-08-13','2026-07-14','2026-08-13',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22'),(10,'VALE-260422-5A8465',4,10,2,2,17,13,'LIQUIDADO',12000.00,5.2000,624.00,280.00,1.8000,1728.00,7.5000,900.00,250.00,14632.00,1829.00,8,8,0.00,NULL,'2025-10-24 03:57:22','2025-10-24 03:57:22','2026-02-21','2026-01-22','2026-02-21',NULL,0,NULL,NULL,'2026-04-22 09:57:22','2026-04-22 09:57:22');
/*!40000 ALTER TABLE `vales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificaciones_solicitud`
--

DROP TABLE IF EXISTS `verificaciones_solicitud`;
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
  `foto_fachada` varchar(255) DEFAULT NULL,
  `foto_ine_con_persona` varchar(255) DEFAULT NULL,
  `foto_comprobante` varchar(255) DEFAULT NULL,
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

--
-- Dumping data for table `verificaciones_solicitud`
--

LOCK TABLES `verificaciones_solicitud` WRITE;
/*!40000 ALTER TABLE `verificaciones_solicitud` DISABLE KEYS */;
INSERT INTO `verificaciones_solicitud` VALUES (1,1,4,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-03-15 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21'),(2,2,4,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-03-20 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21'),(3,3,4,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-04-20 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21'),(4,4,10,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-03-10 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21'),(5,5,10,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-03-17 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21'),(6,6,10,'VERIFICADA','Domicilio confirmado, persona identificada, documentos en orden.',25.5400000,-103.42000000,'2026-04-17 03:57:21','\"{\\\"identidad\\\":true,\\\"domicilio\\\":true,\\\"referencias\\\":true}\"','verificaciones/demo/fachada.jpg','verificaciones/demo/ine_persona.jpg','verificaciones/demo/comprobante.jpg',35.00,'2026-04-21 21:57:21','2026-04-21 21:57:21');
/*!40000 ALTER TABLE `verificaciones_solicitud` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-25 18:40:47
