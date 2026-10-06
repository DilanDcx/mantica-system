import os
import re
from django.utils import timezone
from .pdf_utils import esc, esc_multiline, GENDER_LABELS

CLINIC_NAME = "Centro de Salud Pedro Arauz Palacios"
LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'logo.png')

# ----------------------------------------------------------------------
# DISEÑO COMÚN (colores, tablas estructuradas, macros institucionales)
# ----------------------------------------------------------------------
PREAMBLE = r"""
\documentclass[9pt]{article}
\usepackage[spanish]{babel}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage[letterpaper,margin=1.4cm,top=1.2cm,bottom=1.6cm]{geometry}
\usepackage[table]{xcolor}
\usepackage{tabularx,array,graphicx,fancyhdr}

% Paleta institucional basada en el sistema web
\definecolor{tealdark}{HTML}{0F766E}   % Teal oscuro institucional para títulos y bordes
\definecolor{teal}{HTML}{0FBF9C}       % Teal acento para detalles visuales
\definecolor{tealclaro}{HTML}{E6F7F5}   % Fondo de encabezados de consultas
\definecolor{fondo}{HTML}{FFFFFF}       % Fondo de celdas
\definecolor{bgcelda}{HTML}{F8FAFC}     % Fondo gris muy tenue para contraste
\definecolor{texto}{HTML}{111111}       % Negro / carbón profundo para máxima legibilidad
\definecolor{gris}{HTML}{64748B}        % Gris para etiquetas secundarias
\definecolor{borde}{HTML}{0F766E}       % Borde estructurado

% Alertas médicas (alergias)
\definecolor{alertabg}{HTML}{FEF2F2}
\definecolor{alertabord}{HTML}{DC2626}
\definecolor{alertatxt}{HTML}{991B1B}

\setlength{\parindent}{0pt}
\setlength{\headheight}{14pt}
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyfoot[R]{\scriptsize\color{gris} Página \thepage}
\fancyfoot[L]{\scriptsize\color{gris} Centro de Salud Pedro Arauz Palacios --- Expediente Clínico Oficial}

\arrayrulecolor{borde}
\newcolumntype{Y}{>{\raggedright\arraybackslash}X}
\newcolumntype{C}{|>{\columncolor{fondo}}Y}
\newcolumntype{G}{|>{\columncolor{bgcelda}}Y}

% Celdas estilo ficha técnica institucional: etiqueta arriba en gris/tealdark + valor en negrita/texto
\newcommand{\cel}[2]{{\scriptsize\bfseries\color{tealdark}\MakeUppercase{#1}}\par{\small\color{texto} #2}\rule[-4pt]{0pt}{16pt}}

% Filas estructuradas
\newcommand{\unaC}[1]{\noindent\begin{tabularx}{\textwidth}{C|}#1\\\hline\end{tabularx}\par\nointerlineskip}
\newcommand{\dosC}[2]{\noindent\begin{tabularx}{\textwidth}{CC|}#1&#2\\\hline\end{tabularx}\par\nointerlineskip}
\newcommand{\tresC}[3]{\noindent\begin{tabularx}{\textwidth}{CCC|}#1&#2&#3\\\hline\end{tabularx}\par\nointerlineskip}
\newcommand{\cuatroC}[4]{\noindent\begin{tabularx}{\textwidth}{CCCC|}#1&#2&#3&#4\\\hline\end{tabularx}\par\nointerlineskip}

% Encabezados de sección estilo barra institucional
\newcommand{\seccion}[1]{\par\vspace{6pt}\noindent\colorbox{tealdark}{\parbox{\dimexpr\textwidth-2\fboxsep\relax}{\centering\color{white}\bfseries\footnotesize\MakeUppercase{#1}}}\par\nointerlineskip}

% Cuadro de alerta médica (Alergias)
\newcommand{\cajaAlerta}[1]{%
\par\vspace{5pt}\noindent%
\fcolorbox{alertabord}{alertabg}{%
\parbox{\dimexpr\textwidth-2\fboxsep-2\fboxrule\relax}{%
\color{alertatxt}\bfseries\footnotesize \MakeUppercase{ALERTA CLÍNICA / ALERGIAS:} \normalfont #1%
}}%
\par\vspace{3pt}%
}

% Cuadro de marco legal y confidencialidad
\newcommand{\cajaLegal}[1]{%
\par\vspace{6pt}\noindent%
\fcolorbox{gris}{bgcelda}{%
\parbox{\dimexpr\textwidth-2\fboxsep-2\fboxrule\relax}{%
\scriptsize\color{texto}
{\bfseries\color{tealdark}\MakeUppercase{Marco Legal, Confidencialidad y Políticas de Uso:}}\par
#1%
}}%
\par%
}
"""

# ----------------------------------------------------------------------
# EXPEDIENTE CLÍNICO
# ----------------------------------------------------------------------
EXPEDIENTE_TEX = r"""
\begin{document}

% ENCABEZADO INSTITUCIONAL CON CAJA DE METADATOS
\noindent
\begin{tabularx}{\textwidth}{@{}p{2.6cm}>{\centering\arraybackslash}Xp{4.2cm}@{}}
<<LOGO>> &
{\normalsize\bfseries\color{tealdark} <<CLINICA>>}\par
\vspace{1pt}{\scriptsize\bfseries\color{gris} DEPARTAMENTO DE REGISTRO Y ESTADÍSTICAS DE SALUD}\par
\vspace{2pt}{\large\bfseries\color{texto} EXPEDIENTE CLÍNICO INDIVIDUAL}\par
\vspace{1pt}{\scriptsize\color{gris} Generado el <<HOY>>} &
\fcolorbox{tealdark}{bgcelda}{%
\begin{minipage}[t]{3.9cm}
{\scriptsize\bfseries\color{tealdark} N.º EXPEDIENTE:}\par
{\normalsize\bfseries\color{texto} <<NUM>>}\par\vspace{2pt}
{\scriptsize\bfseries\color{gris} FECHA APERTURA: \color{texto}<<APERTURA>>}\par
{\scriptsize\bfseries\color{gris} ESTADO: \color{tealdark}ACTIVO}
\end{minipage}}
\end{tabularx}
\par\vspace{4pt}\noindent{\color{teal}\rule{\textwidth}{2pt}}\par

% ALERTA DE ALERGIAS (si existen)
<<BLOQUE_ALERGIAS>>

% 1. IDENTIFICACIÓN Y DATOS DEL PACIENTE
\seccion{1. Datos de Identificación del Paciente}
\dosC{\cel{Nombre Completo}{<<NOMBRES>> <<APELLIDOS>>}}{\cel{N.º Cédula de Identidad}{<<CEDULA>>}}
\cuatroC{\cel{Fecha de Nacimiento}{<<NACIMIENTO>>}}{\cel{Edad}{<<EDAD>> años}}{\cel{Sexo}{<<SEXO>>}}{\cel{Tipo de Sangre}{<<SANGRE>>}}
\dosC{\cel{Teléfono de Contacto}{<<TELEFONO>>}}{\cel{Dirección Domiciliar Habitual}{<<DIRECCION>>}}

% 2. ANTECEDENTES Y ALERTAS CLÍNICAS
\seccion{2. Antecedentes Médicos y Clínicos}
\dosC{\cel{Antecedentes Médicos Personales}{<<ANT_MED>>}}{\cel{Antecedentes Heredofamiliares}{<<ANT_FAM>>}}
\unaC{\cel{Observaciones Generales}{<<NOTAS>>}}

% CONTACTO DE EMERGENCIA
\seccion{Contacto de Emergencia}
\tresC{\cel{Nombre}{<<EMER_NOMBRE>>}}{\cel{Teléfono}{<<EMER_TEL>>}}{\cel{Parentesco}{<<EMER_REL>>}}

% 3. REGISTRO DE ATENCIONES MÉDICAS
\seccion{3. Historial de Consultas Médicas (Últimas 5)}
<<CONSULTAS>>

% 4. MARCO LEGAL Y POLÍTICAS
\cajaLegal{El presente expediente clínico constituye un documento médico-legal confidencial y de propiedad exclusiva del \textbf{Centro de Salud Pedro Arauz Palacios}. La información contenida está protegida bajo las normativas de salud pública y resguardo del secreto profesional. Queda prohibida su divulgación o alteración sin autorización explícita de la Dirección Médica.}

% 5. FIRMAS FORMALES
\par\vspace{1.1cm}\noindent
\parbox{0.46\textwidth}{\centering\color{tealdark}\rule{\linewidth}{0.8pt}\par\vspace{3pt}\footnotesize\bfseries\color{texto} Médico Tratante / Responsable\par\scriptsize\color{gris} Firma y Sello Profesional}\hfill
\parbox{0.46\textwidth}{\centering\color{tealdark}\rule{\linewidth}{0.8pt}\par\vspace{3pt}\footnotesize\bfseries\color{texto} Dirección Médica / Archivo Clínico\par\scriptsize\color{gris} Centro de Salud Pedro Arauz Palacios}

\end{document}
"""

CONSULTA_TEX = r"""
\par\vspace{4pt}\noindent
\colorbox{tealclaro}{\parbox{\dimexpr\textwidth-2\fboxsep\relax}{%
\footnotesize\bfseries\color{tealdark} CONSULTA <<N>> \quad\textbar\quad Fecha: <<FECHA>> \quad\textbar\quad Médico: Dr(a). <<MEDICO>>%
}}\par\nointerlineskip
\cuatroC{\cel{PA}{<<PA>> mmHg}}{\cel{Temp}{<<TEMP>> °C}}{\cel{FC / FR}{<<FC>> lpm / <<FR>> rpm}}{\cel{SpO2 / Peso}{<<SPO2>>\% / <<PESO>> kg}}
\dosC{\cel{Motivo de Consulta}{<<MOTIVO>>}}{\cel{Diagnóstico Clínico}{<<DX>>}}
\unaC{\cel{Plan Terapéutico y Prescripción}{<<TX>>}}
"""

# ----------------------------------------------------------------------
# RECETA MÉDICA
# ----------------------------------------------------------------------
RECETA_TEX = r"""
\begin{document}
\noindent
\begin{tabularx}{\textwidth}{@{}p{2.6cm}>{\centering\arraybackslash}Xp{4.2cm}@{}}
<<LOGO>> &
{\normalsize\bfseries\color{tealdark} <<CLINICA>>}\par
\vspace{1pt}{\scriptsize\bfseries\color{gris} SISTEMA DE DISPENSACIÓN FARMACÉUTICA}\par
\vspace{2pt}{\large\bfseries\color{texto} RECETA MÉDICA OFICIAL} &
\fcolorbox{tealdark}{bgcelda}{%
\begin{minipage}[t]{3.9cm}
{\scriptsize\bfseries\color{tealdark} EXPEDIENTE N.º:}\par
{\normalsize\bfseries\color{texto} <<NUM>>}\par\vspace{2pt}
{\scriptsize\bfseries\color{gris} FECHA: \color{texto}<<FECHA>>}
\end{minipage}}
\end{tabularx}
\par\vspace{4pt}\noindent{\color{teal}\rule{\textwidth}{2pt}}\par
\vspace{4pt}

\unaC{\cel{Unidad de Salud}{<<CLINICA>>}}
\dosC{\cel{Nombre del Paciente}{<<PACIENTE>>}}{\cel{Cédula}{<<CEDULA>>}}
\cuatroC{\cel{Edad}{<<EDAD>> años}}{\cel{No. Admisión}{---}}{\cel{Cuarto}{---}}{\cel{Cama}{---}}
\unaC{\cel{Diagnóstico Clínico}{<<DX>>}}

\seccion{R/ Prescripción Médica e Indicaciones}
\unaC{\cel{Detalle de Medicación}{\begin{minipage}[t][6cm]{\linewidth}\color{texto}<<TX>>\end{minipage}}}

\dosC{\cel{Fecha de Emisión}{<<FECHA>>}}{\cel{Firma y Código del Médico}{\rule{0pt}{1.2cm}\par{\scriptsize\color{texto} Dr(a). <<DOCTOR>>}}}

\seccion{Uso Exclusivo de Farmacia}
\tresC{\cel{Código Solicitante}{}}{\cel{Código Medicamento}{}}{\cel{Cantidad Despachada}{}}
\unaC{\cel{Firma y Sello del Despachador}{\rule{0pt}{0.9cm}}}
\end{document}
"""

# ----------------------------------------------------------------------
# FUNCIONES AUXILIARES
# ----------------------------------------------------------------------
def fill(template, **values):
    return re.sub(r'<<(\w+)>>', lambda m: str(values.get(m.group(1), '')), template)

def val(x, default='---'):
    if x is None or str(x).strip() == '':
        return default
    return esc(x)

def val_ml(x, default='---'):
    if x is None or str(x).strip() == '':
        return default
    return esc_multiline(x)

def local(dt):
    if dt is not None and hasattr(dt, 'hour') and timezone.is_aware(dt):
        return timezone.localtime(dt)
    return dt

def as_date(dt):
    return dt.date() if hasattr(dt, 'hour') else dt

def calc_age(birth, on_date):
    return on_date.year - birth.year - ((on_date.month, on_date.day) < (birth.month, birth.day))

def logo_tex():
    if os.path.exists(LOGO_PATH):
        return r'\includegraphics[height=1.8cm]{%s}' % LOGO_PATH.replace('\\', '/')
    return r'\rule{0pt}{1.8cm}'

def doctor_name(doctor):
    if doctor:
        full = f"{doctor.first_name or ''} {doctor.last_name or ''}".strip()
        return full if full else f"@{doctor.username}"
    return "Médico de Turno"

# ----------------------------------------------------------------------
# CONSTRUCTORES
# ----------------------------------------------------------------------
def build_expediente_tex(record, consultations):
    p = record.patient
    hoy = timezone.localtime(timezone.now())
    apertura = local(record.opened_at)
    edad = calc_age(p.birth_date, hoy.date())

    # Formateo de alergias estilo banner de alerta roja (como el HTML)
    bloque_alergias = ""
    if record.allergies and record.allergies.strip():
        bloque_alergias = r"\cajaAlerta{%s}" % esc(record.allergies)

    consultas_tex = ""
    lista = list(consultations)
    for i, c in enumerate(lista, start=1):
        fecha = local(c.consultation_date)
        consultas_tex += fill(
            CONSULTA_TEX,
            N=i,
            FECHA=esc(fecha.strftime('%d/%m/%Y %H:%M')),
            MEDICO=esc(doctor_name(c.doctor)),
            MOTIVO=val(c.reason),
            PA=val(c.blood_pressure),
            PESO=val(c.weight_kg),
            TEMP=val(c.temperature_c),
            FC=val(c.heart_rate_bpm),
            FR=val(c.respiratory_rate),
            SPO2=val(c.oxygen_saturation),
            DX=val_ml(c.diagnosis),
            TX=val_ml(c.treatment_plan),
        )
    if not lista:
        consultas_tex = r"\unaC{\cel{Historial}{No se registran visitas médicas previas en el historial.}}"

    cuerpo = fill(
        EXPEDIENTE_TEX,
        LOGO=logo_tex(),
        CLINICA=esc(CLINIC_NAME),
        HOY=esc(hoy.strftime('%d/%m/%Y %H:%M')),
        NUM=esc(record.record_number),
        APERTURA=esc(apertura.strftime('%d/%m/%Y')),
        BLOQUE_ALERGIAS=bloque_alergias,
        APELLIDOS=val(p.last_name),
        NOMBRES=val(p.first_name),
        EDAD=edad,
        NACIMIENTO=esc(p.birth_date.strftime('%d/%m/%Y')),
        SEXO=esc(GENDER_LABELS.get(p.gender, 'No registrado')),
        SANGRE=val(p.blood_type),
        CEDULA=val(p.identification_card),
        TELEFONO=val(p.phone_number),
        DIRECCION=val_ml(p.address),
        EMER_NOMBRE=val(p.emergency_contact_name),
        EMER_TEL=val(p.emergency_contact_phone),
        EMER_REL=val(p.emergency_contact_relation),
        ANT_MED=val_ml(record.medical_background, 'Sin antecedentes patológicos reportados.'),
        ANT_FAM=val_ml(record.family_background, 'Sin antecedentes hereditarios relevantes.'),
        NOTAS=val_ml(record.notes, 'Sin observaciones registradas.'),
        CONSULTAS=consultas_tex,
    )
    return PREAMBLE + cuerpo

def build_receta_tex(consultation):
    record = consultation.medical_record
    p = record.patient
    fecha = local(consultation.consultation_date)
    edad = calc_age(p.birth_date, as_date(fecha))

    cuerpo = fill(
        RECETA_TEX,
        LOGO=logo_tex(),
        CLINICA=esc(CLINIC_NAME),
        NUM=esc(record.record_number),
        PACIENTE=esc(f"{p.first_name} {p.last_name}".strip()),
        CEDULA=val(p.identification_card),
        EDAD=edad,
        DX=val_ml(consultation.diagnosis),
        TX=val_ml(consultation.treatment_plan, 'Sin indicaciones registradas'),
        FECHA=esc(fecha.strftime('%d / %m / %Y')),
        DOCTOR=esc(doctor_name(consultation.doctor)),
    )
    return PREAMBLE + cuerpo