"""Motor de emparejamiento explicable de IncluTrabajo AI.

Versión 2. Mantiene la ponderación documentada en el diseño conceptual:
- 40 % competencias requeridas
- 30 % accesibilidad y ajustes razonables
- 15 % ubicación y modalidad
- 15 % salario y jornada (10 salario + 5 jornada)

No usa edad, género, nacionalidad, discapacidad ni ningún otro atributo
protegido. Si falta información, no se regalan puntos: se marca la dimensión
como "sin datos" para que la persona complete su perfil.
"""
import unicodedata

VERSION = "matching_v2"
PESOS = {
    "competencias": 40,
    "accesibilidad": 30,
    "ubicacion": 15,
    "salario_jornada": 15,
}


def _norm(valor):
    texto = str(valor or "").strip().lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def _lista_nombres(items):
    return {_norm(i.get("nombre")) for i in (items or []) if i.get("nombre")}


def calcular_emparejamiento(candidato, vacante):
    razones = []
    faltantes = []
    detalle = []
    sin_datos = 0
    bloqueante = False

    # ---------- 1. Competencias (40 %) ----------
    cand_comps = _lista_nombres(candidato.get("competencias"))
    vac_comps = _lista_nombres(vacante.get("requisitos"))
    if not vac_comps:
        comp_score = 0
        sin_datos += 1
        estado_comp = "sin_datos"
        detalle_comp = "La vacante no especificó competencias requeridas."
        faltantes.append("La vacante no declara competencias; el resultado es preliminar.")
    elif not cand_comps:
        comp_score = 0
        sin_datos += 1
        estado_comp = "sin_datos"
        detalle_comp = "Todavía no declaraste competencias en tu perfil."
        faltantes.append("Completa tus competencias para calcular este criterio.")
    else:
        comun = cand_comps.intersection(vac_comps)
        comp_score = round((len(comun) / len(vac_comps)) * PESOS["competencias"], 2)
        estado_comp = "ok" if comun else "no_cumple"
        detalle_comp = f"Coinciden {len(comun)} de {len(vac_comps)} competencias requeridas."
        if comun:
            razones.append(
                f"Coinciden {len(comun)} de {len(vac_comps)} competencias requeridas "
                f"({', '.join(sorted(comun))})."
            )
        else:
            faltantes.append("No coinciden las competencias técnicas principales.")
    detalle.append({
        "criterio": "competencias",
        "etiqueta": "Competencias",
        "peso": PESOS["competencias"],
        "obtenido": round(comp_score, 1),
        "maximo": PESOS["competencias"],
        "estado": estado_comp,
        "detalle": detalle_comp,
    })

    # ---------- 2. Accesibilidad (30 %) ----------
    necesidades = candidato.get("necesidades") or []
    cand_necesidades = {_norm(n.get("nombre")) for n in necesidades if n.get("nombre")}
    vac_accesibilidad = _lista_nombres(vacante.get("accesibilidad"))
    verificadas = {
        _norm(a.get("nombre"))
        for a in (vacante.get("accesibilidad") or [])
        if a.get("verificada")
    }
    pesos_critica = {"esencial": 3, "importante": 2, "deseable": 1}

    def peso_necesidad(n):
        if n.get("critica"):
            return pesos_critica["esencial"]
        return pesos_critica["importante"]

    if not cand_necesidades:
        acc_score = PESOS["accesibilidad"]
        estado_acc = "ok"
        detalle_acc = "No declaraste necesidades de accesibilidad."
        razones.append("No especificaste necesidades de accesibilidad restrictivas.")
    elif not vac_accesibilidad:
        acc_score = 0
        sin_datos += 1
        estado_acc = "sin_datos"
        detalle_acc = "La empresa no declaró condiciones de accesibilidad."
        faltantes.append("La empresa no declaró accesibilidad para este puesto.")
        if any(n.get("critica") for n in necesidades):
            bloqueante = True
    else:
        peso_total = sum(peso_necesidad(n) for n in necesidades)
        cubiertas = [n for n in necesidades if _norm(n.get("nombre")) in vac_accesibilidad]
        no_cubiertas = [n for n in necesidades if _norm(n.get("nombre")) not in vac_accesibilidad]
        peso_cubierto = sum(peso_necesidad(n) for n in cubiertas)
        acc_score = round((peso_cubierto / peso_total) * PESOS["accesibilidad"], 2) if peso_total else 0
        faltan_criticas = [n for n in no_cubiertas if n.get("critica")]
        if faltan_criticas:
            bloqueante = True
        estado_acc = "ok" if not no_cubiertas else ("no_cumple" if not cubiertas else "parcial")
        detalle_acc = (
            f"{len(cubiertas)} de {len(necesidades)} necesidades declaradas están cubiertas."
        )
        if cubiertas:
            razones.append(
                f"El puesto cubre {len(cubiertas)} de tus {len(necesidades)} "
                "necesidades de accesibilidad."
            )
        if no_cubiertas:
            nombres = ", ".join(_norm(n.get("nombre")) for n in no_cubiertas)
            faltantes.append(f"El puesto no declara: {nombres}.")
        if faltan_criticas:
            faltantes.append(
                "Hay una necesidad de accesibilidad esencial sin cubrir; "
                "la vacante se marca como no compatible."
            )
    detalle.append({
        "criterio": "accesibilidad",
        "etiqueta": "Accesibilidad",
        "peso": PESOS["accesibilidad"],
        "obtenido": round(acc_score, 1),
        "maximo": PESOS["accesibilidad"],
        "estado": estado_acc,
        "detalle": detalle_acc,
        "verificadas": len(verificadas.intersection(cand_necesidades)),
        "total_declaradas": len(vac_accesibilidad),
    })

    # ---------- 3. Ubicación y modalidad (15 %) ----------
    ciudad_ok = _norm(candidato.get("ciudad")) == _norm(vacante.get("ciudad"))
    pref = _norm(candidato.get("modalidad_pref")) or "cualquiera"
    modalidad = _norm(vacante.get("modalidad"))
    if pref == "cualquiera":
        loc_score = PESOS["ubicacion"] if (ciudad_ok or modalidad == "remoto") else 8
        loc_detalle = "Aceptas cualquier modalidad; se valora la ciudad."
    elif pref == modalidad:
        if modalidad == "remoto" or ciudad_ok:
            loc_score = PESOS["ubicacion"]
            loc_detalle = "La modalidad coincide con tu preferencia."
        else:
            loc_score = 7
            loc_detalle = "La modalidad coincide, pero la ciudad es distinta."
    else:
        loc_score = 0
        loc_detalle = f"Prefieres {pref} y la vacante es {modalidad}."
        faltantes.append(loc_detalle)
    if loc_score == PESOS["ubicacion"]:
        razones.append(f"Compatibilidad de ubicación o modalidad ({modalidad}).")
    elif loc_score < PESOS["ubicacion"] and not ciudad_ok:
        faltantes.append(f"Diferencia de ciudad ({candidato.get('ciudad')} vs {vacante.get('ciudad')}).")
    detalle.append({
        "criterio": "ubicacion",
        "etiqueta": "Ubicación y modalidad",
        "peso": PESOS["ubicacion"],
        "obtenido": round(loc_score, 1),
        "maximo": PESOS["ubicacion"],
        "estado": "ok" if loc_score == PESOS["ubicacion"] else ("parcial" if loc_score else "no_cumple"),
        "detalle": loc_detalle,
    })

    # ---------- 4. Salario y jornada (15 %: 10 + 5) ----------
    vac_sal = float(vacante.get("salario") or 0)
    cand_min = float(candidato.get("salario_min") or 0)
    if cand_min <= 0:
        sal_score = 0
        sal_detalle = "No declaraste una aspiración salarial."
        faltantes.append("Declara tu aspiración salarial para calcular este criterio.")
    elif vac_sal >= cand_min:
        sal_score = 10
        sal_detalle = "El salario ofrecido cumple tu expectativa mínima."
        razones.append(f"El salario ofertado (${vac_sal:,.0f}) cumple tu expectativa mínima.")
    else:
        sal_score = 0
        sal_detalle = "El salario ofrecido está por debajo de tu expectativa."
        faltantes.append("El salario ofertado es inferior a tu aspiración mínima.")

    pref_jornada = _norm(candidato.get("jornada_pref")) or "cualquiera"
    jornada = _norm(vacante.get("jornada"))
    if pref_jornada == "cualquiera" or pref_jornada == jornada:
        jor_score = 5
        jor_detalle = "La jornada es compatible con tu preferencia."
    else:
        jor_score = 0
        jor_detalle = f"Prefieres jornada {pref_jornada} y la vacante es {jornada}."
        faltantes.append(jor_detalle)

    detalle.append({
        "criterio": "salario_jornada",
        "etiqueta": "Salario y jornada",
        "peso": PESOS["salario_jornada"],
        "obtenido": round(sal_score + jor_score, 1),
        "maximo": PESOS["salario_jornada"],
        "estado": "ok" if (sal_score + jor_score) == PESOS["salario_jornada"] else (
            "parcial" if (sal_score + jor_score) else "no_cumple"
        ),
        "detalle": f"{sal_detalle} {jor_detalle}",
    })

    score_total = int(round(comp_score + acc_score + loc_score + sal_score + jor_score))
    score_total = max(0, min(100, score_total))
    if bloqueante:
        nivel = "No compatible"
    elif score_total >= 80:
        nivel = "Alta"
    elif score_total >= 50:
        nivel = "Media"
    else:
        nivel = "Baja"

    if sin_datos >= 2:
        confianza = "baja"
    elif sin_datos == 1:
        confianza = "media"
    else:
        confianza = "alta"

    return {
        "score": score_total,
        "nivel": nivel,
        "compatible": (not bloqueante) and score_total >= 50,
        "bloqueante": bloqueante,
        "confianza": confianza,
        "version": VERSION,
        "razones": razones,
        "faltantes": faltantes,
        "detalle": detalle,
    }
