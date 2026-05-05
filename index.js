/**
 * ARCHIVO PRINCIPAL DEL BACKEND - VehiTrack API
 * 
 * Proyecto: VehiTrack - Gestión de Mantenimiento Vehicular
 * Evidencia: GA7-220501096-AA5-EV01 / EV02
 * Ajustado según la base de datos vehitrack_db_2.sql
 * Autores: Jeison Alvin Guzman Londoño, Yulian Didier Gamboa Sanabria, Tania Yisela Quezada Ramos.
 */

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // Permite el acceso desde el frontend
app.use(express.json()); // Permite recibir y leer datos en formato JSON

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'vehitrack_db'
});

// Conectar a MySQL y verificar estado
db.connect((err) => {
    if (err) {
        console.error('❌ Error crítico: No se pudo conectar a la base de datos: ' + err.stack);
        return;
    }
    console.log('✅ Conexión exitosa a la base de datos MySQL');
});

// ==========================================
// ENDPOINT DE PRUEBA (Health Check)
// ==========================================
app.get('/api/prueba', (req, res) => {
    res.json({
        status: 'Servidor Activo',
        mensaje: '¡Hola Jeison! El backend de VehiTrack está funcionando correctamente.',
        timestamp: new Date().toLocaleString()
    });
});

// ============================================================
// MODULO 1: GESTIÓN DE USUARIOS Y AUTENTICACIÓN
// ============================================================

/**
 * Registro de nuevos usuarios en la tabla 'usuario'.
 */
app.post('/api/usuarios', (req, res) => {
    const { nombre, apellido, email, contraseña } = req.body;
    const query = 'INSERT INTO usuario (nombre, apellido, email, contraseña) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, apellido, email, contraseña], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
        res.status(201).json({ status: 'success', id: result.insertId, message: 'Usuario registrado correctamente' });
    });
});

/**
 * Login: Verifica que el email y la contraseña coincidan.
 */
app.post('/api/login', (req, res) => {
    const { email, contraseña } = req.body;
    const query = 'SELECT id_usuario, nombre, email FROM usuario WHERE email = ? AND contraseña = ?';

    db.query(query, [email, contraseña], (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error en el servidor' });

        if (results.length > 0) {
            res.json({ 
                status: 'success', 
                message: 'Autenticación satisfactoria',
                user: results[0] 
            });
        } else {
            res.status(401).json({ status: 'error', message: 'Error en la autenticación: Credenciales inválidas' });
        }
    });
});

/**
 * Actualizar datos de un usuario existente.
 */
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, contraseña } = req.body;
    const query = 'UPDATE usuario SET nombre = ?, apellido = ?, email = ?, contraseña = ? WHERE id_usuario = ?';
    db.query(query, [nombre, apellido, email, contraseña, id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al actualizar usuario' });
        res.json({ status: 'success', message: 'Usuario actualizado correctamente' });
    });
});

/**
 * Obtener lista de todos los usuarios registrados.
 */
app.get('/api/usuarios', (req, res) => {
    const query = 'SELECT id_usuario, nombre, apellido, email FROM usuario';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al consultar usuarios' });
        res.json(results);
    });
});

/**
 * Eliminar un usuario (Solo si no tiene vehículos asociados).
 */
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM usuario WHERE id_usuario = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'No se puede eliminar: El usuario tiene vehículos vinculados.' 
                });
            }
            return res.status(500).json({ status: 'error', message: 'Error al eliminar usuario' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        res.json({ status: 'success', message: 'Usuario eliminado correctamente' });
    });
});

// ============================================================
// MODULO 2: GESTIÓN DE VEHÍCULOS
// ============================================================

/**
 * Registrar un nuevo vehículo asociado a un usuario.
 */
app.post('/api/vehiculos', (req, res) => {
    const { id_usuario, tipo, marca, modelo, anio, kilometraje_actual, placa, vencimiento_soat, vencimiento_rtm } = req.body;
    const query = 'INSERT INTO vehiculo (id_usuario, tipo, marca, modelo, anio, kilometraje_actual, placa, vencimiento_soat, vencimiento_rtm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [id_usuario, tipo, marca, modelo, anio, kilometraje_actual, placa, vencimiento_soat, vencimiento_rtm], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar vehículo' });
        res.json({ status: 'success', id: result.insertId });
    });
});

/**
 * Actualizar la información de un vehículo.
 */
app.put('/api/vehiculos/:id', (req, res) => {
    const { id } = req.params;
    const { tipo, marca, modelo, anio, kilometraje_actual, placa, vencimiento_soat, vencimiento_rtm } = req.body;
    const query = 'UPDATE vehiculo SET tipo=?, marca=?, modelo=?, anio=?, kilometraje_actual=?, placa=?, vencimiento_soat=?, vencimiento_rtm=? WHERE id_vehiculo=?';
    db.query(query, [tipo, marca, modelo, anio, kilometraje_actual, placa, vencimiento_soat, vencimiento_rtm, id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al actualizar vehículo' });
        res.json({ status: 'success', message: 'Vehículo actualizado correctamente' });
    });
});

/**
 * Obtener todos los vehículos de un usuario específico.
 */
app.get('/api/vehiculos/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;
    const query = 'SELECT * FROM vehiculo WHERE id_usuario = ?';
    db.query(query, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * Eliminar un vehículo (Solo si no tiene mantenimientos o gastos).
 */
app.delete('/api/vehiculos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM vehiculo WHERE id_vehiculo = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'No se puede eliminar: El vehículo tiene mantenimientos o gastos registrados.' 
                });
            }
            return res.status(500).json({ status: 'error', message: 'Error al eliminar vehículo' });
        }
        res.json({ status: 'success', message: 'Vehículo eliminado correctamente' });
    });
});

// ============================================================
// MODULO 3: MANTENIMIENTO Y COMBUSTIBLE
// ============================================================

/**
 * Registrar un nuevo mantenimiento técnico.
 */
app.post('/api/mantenimiento', (req, res) => {
    const { id_vehiculo, fecha_programada, descripcion, costo, kilometraje_mantenimiento } = req.body;
    const query = 'INSERT INTO mantenimiento (id_vehiculo, fecha_programada, descripcion, costo, kilometraje_mantenimiento) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [id_vehiculo, fecha_programada, descripcion, costo, kilometraje_mantenimiento], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ status: 'success', id: result.insertId });
    });
});

/**
 * Actualizar un registro de mantenimiento existente.
 */
app.put('/api/mantenimiento/:id', (req, res) => {
    const { id } = req.params;
    const { fecha_programada, descripcion, costo, kilometraje_mantenimiento } = req.body;
    const query = 'UPDATE mantenimiento SET fecha_programada=?, descripcion=?, costo=?, kilometraje_mantenimiento=? WHERE id_mantenimiento=?';
    db.query(query, [fecha_programada, descripcion, costo, kilometraje_mantenimiento, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ status: 'success', message: 'Mantenimiento actualizado correctamente' });
    });
});

/**
 * Consultar historial de mantenimiento de un vehículo.
 */
app.get('/api/mantenimiento/:id_vehiculo', (req, res) => {
    const { id_vehiculo } = req.params;
    const query = 'SELECT * FROM mantenimiento WHERE id_vehiculo = ?';
    db.query(query, [id_vehiculo], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * Eliminar un registro de mantenimiento.
 */
app.delete('/api/mantenimiento/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM mantenimiento WHERE id_mantenimiento = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al eliminar mantenimiento' });
        res.json({ status: 'success', message: 'Mantenimiento eliminado correctamente' });
    });
});

/**
 * Registrar un gasto de combustible.
 */
app.post('/api/combustible', (req, res) => {
    const { id_vehiculo, fecha, cantidad_galones_litros, costo_local, kilometraje } = req.body;
    const query = 'INSERT INTO gasto_combustible (id_vehiculo, fecha, cantidad_galones_litros, costo_local, kilometraje) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [id_vehiculo, fecha, cantidad_galones_litros, costo_local, kilometraje], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ status: 'success', id: result.insertId });
    });
});

/**
 * Actualizar un registro de gasto de combustible.
 */
app.put('/api/combustible/:id', (req, res) => {
    const { id } = req.params;
    const { fecha, cantidad_galones_litros, costo_local, kilometraje } = req.body;
    const query = 'UPDATE gasto_combustible SET fecha=?, cantidad_galones_litros=?, costo_local=?, kilometraje=? WHERE id_gasto=?';
    db.query(query, [fecha, cantidad_galones_litros, costo_local, kilometraje, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ status: 'success', message: 'Gasto de combustible actualizado correctamente' });
    });
});

/**
 * Consultar historial de combustible de un vehículo.
 */
app.get('/api/combustible/:id_vehiculo', (req, res) => {
    const { id_vehiculo } = req.params;
    const query = 'SELECT * FROM gasto_combustible WHERE id_vehiculo = ?';
    db.query(query, [id_vehiculo], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * Eliminar un registro de gasto de combustible.
 */
app.delete('/api/combustible/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM gasto_combustible WHERE id_gasto = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al eliminar combustible' });
        res.json({ status: 'success', message: 'Gasto de combustible eliminado correctamente' });
    });
});

// ============================================================
// MODULO 4: FAVORITOS
// ============================================================

/**
 * Consultar talleres favoritos de un usuario.
 */
app.get('/api/favoritos/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;
    const query = 'SELECT * FROM favoritos_talleres WHERE id_usuario = ?';
    db.query(query, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * Eliminar un taller de la lista de favoritos.
 */
app.delete('/api/favoritos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM favoritos_talleres WHERE id_favorito = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error al eliminar favorito' });
        res.json({ status: 'success', message: 'Taller eliminado de favoritos correctamente' });
    });
});

// ============================================================
// ARRANQUE DEL SERVIDOR
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor VehiTrack corriendo en: http://localhost:${PORT}`);
    console.log(`📌 Listo para las pruebas de Postman`);
});