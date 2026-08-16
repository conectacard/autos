/**
 * masventa CONTROL - Motor de Auditoría y Semáforo de Maduración
 * Cliente: Demo Agencia de Autos Genérica
 */

const CLAVE_GERENCIAL_ACCESO = "AUTO2026"; 
const ASESORES_AGENCIA = ["Asesor 1", "Asesor 2", "Asesor 3", "Asesor 4", "Asesor 5", "Asesor 6"];

function verificarAccesoGerente() {
    const inputClave = document.getElementById('pass-input').value;
    if (inputClave === CLAVE_GERENCIAL_ACCESO) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('panel-gerente').style.display = 'block';
        cargarYProcesarAuditoria();
        cargarRécordAsesores(); 
        cargarReseñasGerencia(); 
    } else {
        alert("Clave gerencial incorrecta. Acceso denegado.");
    }
}

function cerrarSesionGerente() {
    document.getElementById('pass-input').value = '';
    document.getElementById('panel-gerente').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

function cargarYProcesarAuditoria() {
    // Lee la base de datos de prospectos y reintentos recolectada por los asesores
    const registros = JSON.parse(localStorage.getItem('db_prospectos_agencia')) || [];
    const tbody = document.getElementById('tabla-prospectos-body');
    tbody.innerHTML = ''; 
    
    let total = registros.length;
    let verdes = 0; let amarillos = 0; let rojos = 0;
    
    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#555; padding: 20px;">No hay registros de prospectos todavía.</td></tr>`;
        actualizarIndicadoresKPI(0, 0, 0, 0);
        return;
    }
    
    registros.forEach((prospecto) => {
        let intentos = prospecto.intentos || 1;
        let claseBadge = ""; 
        let textoEstado = "";

        // Lógica de semáforo automática basada en los intentos de seguimiento
        if (intentos >= 3) { 
            claseBadge = "badge-verde"; textoEstado = "Prospecto Activo (Verde)"; verdes++; 
        } else if (intentos === 2) { 
            claseBadge = "badge-amarillo"; textoEstado = "En Seguimiento (Amarillo)"; amarillos++; 
        } else { 
            claseBadge = "badge-rojo"; textoEstado = "Nuevo / Esperando (Rojo)"; rojos++; 
        }
        
        let fecha = prospecto.primerContacto || "No registrada";
        let nombre = prospecto.nombre || "Sin nombre";
        let contacto = prospecto.contacto || "No reg.";
        let asesor = `Asesor ID: ${prospecto.asesor}` || "No asignado";
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span class="badge-semaforo ${claseBadge}">${textoEstado}</span></td>
            <td style="font-weight:bold; color:#fff;">${nombre}</td>
            <td>
                <a href="https://wa.me/${contacto.replace(/\D/g, '')}" target="_blank" style="color:#00c851; text-decoration:none;">
                    <i class="fab fa-whatsapp"></i> ${contacto}
                </a>
            </td>
            <td style="color:#00f0ff; font-weight:bold;">${asesor}</td>
            <td>${fecha}</td>
            <td style="text-align:center; font-weight:bold; color:#ffbb33; font-size: 16px;">${intentos} veces</td>
        `;
        tbody.appendChild(fila);
    });
    
    actualizarIndicadoresKPI(total, verdes, amarillos, rojos);
}

function cargarRécordAsesores() {
    const tbodyAsesores = document.getElementById('tabla-asesores-body');
    if (!tbodyAsesores) return;
    
    tbodyAsesores.innerHTML = '';
    const key = 'AUDITORIA_COMPARTIDOS_ASESORES';
    let datosAsesores = JSON.parse(localStorage.getItem(key)) || {};
    
    ASESORES_AGENCIA.forEach((nombreAsesor, index) => {
        let idAsesorStr = String(index + 1);
        let total = 0;
        
        if (datosAsesores[nombreAsesor] && datosAsesores[nombreAsesor].totalCompartidos) {
            total = datosAsesores[nombreAsesor].totalCompartidos;
        }
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="font-weight:bold; color:#00f0ff;">${nombreAsesor} (ID: ${idAsesorStr})</td>
            <td><span style="font-size: 16px; font-weight: bold; color: #00c851;">${total} envíos</span></td>
        `;
        tbodyAsesores.appendChild(fila);
    });
}

function cargarReseñasGerencia() {
    const tbodyReseñas = document.getElementById('tabla-reseñas-gerencia-body');
    if (!tbodyReseñas) return;
    
    tbodyReseñas.innerHTML = '';
    const historial = JSON.parse(localStorage.getItem('historial_reseñas_cards')) || [];
    
    if (historial.length === 0) {
        tbodyReseñas.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#555; padding: 20px;">No hay evaluaciones de asesores registradas todavía.</td></tr>`;
        return;
    }
    
    historial.forEach((item) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.fecha}</td>
            <td style="font-weight:bold; color:#00f0ff;">${item.asesor}</td>
            <td style="color: #ffbb33; font-size: 16px;">${'⭐'.repeat(Number(item.calificacion))} (${item.calificacion}/5)</td>
            <td style="color: #ddd;">${item.comentario}</td>
        `;
        tbodyReseñas.appendChild(fila);
    });
}

function actualizarIndicadoresKPI(t, v, a, r) {
    document.getElementById('kpi-total').innerText = t;
    document.getElementById('kpi-verde').innerText = v;
    document.getElementById('kpi-amarillo').innerText = a;
    document.getElementById('kpi-rojo').innerText = r;
}

function exportarAExcel() {
    const registros = JSON.parse(localStorage.getItem('db_prospectos_agencia')) || [];
    if (registros.length === 0) { alert("No hay datos para exportar."); return; }
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Cliente,Contacto,Asesor,Primer Contacto,Intentos,Estado\n";
    
    registros.forEach((p) => {
        csvContent += `"${p.nombre || ''}","${p.contacto || ''}","Asesor ID: ${p.asesor || ''}","${p.primerContacto || ''}","${p.intentos || 1}","${p.estado || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Reporte_Seguimiento_Prospectos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function limpiarPanelGerencial() {
    if (confirm("¿Estás seguro de vaciar el panel de auditoría por completo?")) {
        localStorage.removeItem('db_prospectos_agencia');
        localStorage.removeItem('AUDITORIA_COMPARTIDOS_ASESORES');
        localStorage.removeItem('historial_reseñas_cards');
        alert("Panel vaciado correctamente.");
        location.reload();
    }
}