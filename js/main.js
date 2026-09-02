document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     MENÚ MÓVIL
     ===================================================== */

  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

      const open = mainNav.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        open ? "true" : "false"
      );

      menuToggle.textContent = open ? "✕" : "☰";

    });


    mainNav.querySelectorAll("a").forEach(link => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        menuToggle.textContent = "☰";

      });

    });

  }


  /* =====================================================
     ANIMACIONES AL HACER SCROLL
     ===================================================== */

  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.12
      }
    );


    revealElements.forEach(element => {

      observer.observe(element);

    });

  } else {

    revealElements.forEach(element => {

      element.classList.add("visible");

    });

  }


  /* =====================================================
     DIAGNÓSTICO IA
     ===================================================== */

  const diagnosisForm =
    document.getElementById("diag-form");

  const caseText =
    document.getElementById("case-text");

  const analyzeButton =
    document.getElementById("analyze-btn");

  const statusLabel =
    document.getElementById("status-label");

  const errorBox =
    document.getElementById("diag-error");

  const resultBox =
    document.getElementById("diag-result");

  const gaugeText =
    document.getElementById("gauge-text");

  const resultBadge =
    document.getElementById("result-badge");

  const resultTitle =
    document.getElementById("result-title");

  const resultSummary =
    document.getElementById("result-summary");

  const resultFactors =
    document.getElementById("result-factors");

  const resultNext =
    document.getElementById("result-next");

  const continuar =
    document.getElementById("continuar");


  let currentDiagnosis = null;


  if (diagnosisForm) {

    diagnosisForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const text =
          caseText.value.trim();


        /* ---------------------------------------------
           VALIDACIÓN
           --------------------------------------------- */

        if (text.length < 20) {

          showError(
            "Necesitamos un poco más de contexto para realizar una evaluación útil."
          );

          return;

        }


        hideError();


        resultBox.style.display = "none";


        if (continuar) {

          continuar.hidden = true;

        }


        /* ---------------------------------------------
           ESTADO DE CARGA
           --------------------------------------------- */

        analyzeButton.disabled = true;

        analyzeButton.textContent =
          "Analizando...";


        if (statusLabel) {

          statusLabel.textContent =
            "Estamos revisando los elementos principales de tu caso...";

        }


        try {

          /* -------------------------------------------
             LLAMADA AL BACKEND

             IMPORTANTE:
             enviamos "caso" porque ese es el parámetro
             que utiliza actualmente analyze.js.
             ------------------------------------------- */

          const response =
            await fetch("/api/analyze", {

              method: "POST",

              headers: {
                "Content-Type": "application/json"
              },

              body: JSON.stringify({

                caso: text

              })

            });


          let data;


          try {

            data = await response.json();

          } catch {

            throw new Error(
              "El servidor no devolvió una respuesta válida."
            );

          }


          if (!response.ok) {

            throw new Error(
              data?.error ||
              "No fue posible analizar el caso."
            );

          }


          /* -------------------------------------------
             GUARDAR CONTEXTO DEL DIAGNÓSTICO
             ------------------------------------------- */

          currentDiagnosis = {

            query: text,

            result: data,

            date: new Date().toISOString()

          };


          try {

            sessionStorage.setItem(
              "duarte_diagnosis",
              JSON.stringify(currentDiagnosis)
            );

          } catch {

            /* No hacemos nada si el navegador
               bloquea sessionStorage */

          }


          /* -------------------------------------------
             MOSTRAR RESULTADO
             ------------------------------------------- */

          renderDiagnosis(data);


          resultBox.style.display =
            "block";


          /* -------------------------------------------
             MOSTRAR CAPTURA DEL LEAD
             ------------------------------------------- */

          if (continuar) {

            continuar.hidden = false;

            setTimeout(() => {

              continuar.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            }, 250);

          }


        } catch (error) {

          console.error(
            "Error en diagnóstico:",
            error
          );


          showError(
            error.message ||
            "Ocurrió un error al analizar tu caso."
          );


        } finally {

          analyzeButton.disabled =
            false;


          analyzeButton.innerHTML =
            "Analizar mi caso <span>→</span>";


          if (statusLabel) {

            statusLabel.textContent =
              "Evaluación preliminar asistida por IA.";

          }

        }

      }
    );

  }


  /* =====================================================
     RENDER DEL DIAGNÓSTICO
     ===================================================== */

  function renderDiagnosis(data) {

    const viability =
      normalizeViability(
        data.viabilidad
      );


    if (gaugeText) {

      gaugeText.textContent =
        `${viability}%`;

    }


    /* ---------------------------------------------
       CLASIFICACIÓN
       --------------------------------------------- */

    if (resultBadge) {

      if (viability >= 70) {

        resultBadge.textContent =
          "Perspectiva favorable";

      } else if (viability >= 40) {

        resultBadge.textContent =
          "Requiere revisión";

      } else {

        resultBadge.textContent =
          "Atención prioritaria";

      }

    }


    /* ---------------------------------------------
       TÍTULO
       --------------------------------------------- */

    if (resultTitle) {

      resultTitle.textContent =
        data.titulo ||
        "Evaluación preliminar";

    }


    /* ---------------------------------------------
       RESUMEN
       --------------------------------------------- */

    if (resultSummary) {

      resultSummary.textContent =
        data.resumen ||
        "La evaluación identifica elementos que conviene revisar con mayor detalle.";

    }


    /* ---------------------------------------------
       FACTORES
       --------------------------------------------- */

    fillResultBlock(
      resultFactors,
      "Lo que identificamos",
      data.factores ||
      data.factors ||
      data.identificado
    );


    /* ---------------------------------------------
       SIGUIENTE PASO
       --------------------------------------------- */

    fillResultBlock(
      resultNext,
      "Siguiente paso",
      data.siguiente_paso ||
      data.next_step ||
      "Conviene revisar el caso con mayor información antes de tomar una decisión."
    );

  }


  /* =====================================================
     NORMALIZAR VIABILIDAD
     ===================================================== */

  function normalizeViability(value) {

    let number =
      Number(value);


    if (Number.isNaN(number)) {

      const text =
        String(value || "")
          .toLowerCase();


      if (
        text.includes("alta") ||
        text.includes("favorable")
      ) {

        return 80;

      }


      if (
        text.includes("media") ||
        text.includes("moderada")
      ) {

        return 55;

      }


      if (
        text.includes("baja") ||
        text.includes("desfavorable")
      ) {

        return 30;

      }


      return 50;

    }


    if (number <= 1) {

      number *= 100;

    }


    return Math.max(
      0,
      Math.min(
        100,
        Math.round(number)
      )
    );

  }


  /* =====================================================
     MOSTRAR BLOQUES DEL RESULTADO
     ===================================================== */

  function fillResultBlock(
    container,
    heading,
    content
  ) {

    if (!container) {
      return;
    }


    container.innerHTML = "";


    const headingElement =
      document.createElement("h4");


    headingElement.textContent =
      heading;


    container.appendChild(
      headingElement
    );


    if (!content) {

      const paragraph =
        document.createElement("p");


      paragraph.textContent =
        "No hay información suficiente para desarrollar este punto.";


      container.appendChild(
        paragraph
      );


      return;

    }


    /* ---------------------------------------------
       SI ES UN ARRAY
       --------------------------------------------- */

    if (Array.isArray(content)) {

      const list =
        document.createElement("ul");


      content.forEach(item => {

        const listItem =
          document.createElement("li");


        if (
          typeof item === "string"
        ) {

          listItem.textContent =
            item;

        } else {

          listItem.textContent =
            JSON.stringify(item);

        }


        list.appendChild(
          listItem
        );

      });


      container.appendChild(
        list
      );


      return;

    }


    /* ---------------------------------------------
       SI ES TEXTO
       --------------------------------------------- */

    const paragraph =
      document.createElement("p");


    if (
      typeof content === "string"
    ) {

      paragraph.textContent =
        content;

    } else {

      paragraph.textContent =
        JSON.stringify(content);

    }


    container.appendChild(
      paragraph
    );

  }


  /* =====================================================
     MENSAJES DE ERROR
     ===================================================== */

  function showError(message) {

    if (!errorBox) {
      return;
    }


    errorBox.textContent =
      message;


    errorBox.style.display =
      "block";

  }


  function hideError() {

    if (!errorBox) {
      return;
    }


    errorBox.textContent =
      "";


    errorBox.style.display =
      "none";

  }


  /* =====================================================
     CAPTURA DEL LEAD
     ===================================================== */

  const leadForm =
    document.getElementById("lead-form");


  if (leadForm) {

    leadForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const name =
          document
            .getElementById("lead-name")
            ?.value
            .trim();


        const whatsapp =
          document
            .getElementById("lead-whatsapp")
            ?.value
            .trim();


        const email =
          document
            .getElementById("lead-email")
            ?.value
            .trim();


        const type =
          document
            .getElementById("lead-type")
            ?.value;


        /* ---------------------------------------------
           VALIDACIÓN
           --------------------------------------------- */

        if (
          !name ||
          !whatsapp ||
          !type
        ) {

          alert(
            "Completa tu nombre, WhatsApp y tipo de usuario."
          );

          return;

        }


        /* ---------------------------------------------
           CREAR ID DEL LEAD
           --------------------------------------------- */

        const leadId =
          `DL-${Math.floor(
            10000 +
            Math.random() * 90000
          )}`;


        /* ---------------------------------------------
           CREAR REGISTRO LOCAL

           NOTA:
           Esto es temporal.
           La persistencia real se implementará
           posteriormente en el backend.
           --------------------------------------------- */

        const lead = {

          id: leadId,

          name,

          whatsapp,

          email:
            email || null,

          type,

          original_case:
            currentDiagnosis?.query ||
            caseText?.value ||
            "",

          diagnosis:
            currentDiagnosis?.result ||
            null,

          created_at:
            new Date().toISOString(),

          origin:
            "diagnostico_ia"

        };


        try {

          sessionStorage.setItem(
            "duarte_lead",
            JSON.stringify(lead)
          );

        } catch {

          /* El flujo de WhatsApp
             continúa aunque sessionStorage
             no esté disponible */

        }


        /* ---------------------------------------------
           WHATSAPP

           No enviamos el contenido jurídico
           completo por WhatsApp.

           Enviamos únicamente el ID para que
           posteriormente el backend pueda
           relacionarlo con el diagnóstico.
           --------------------------------------------- */

        const message =
          `Hola, quiero revisar con Duarte mi diagnóstico IA. ID: ${leadId}`;


        const whatsappUrl =
          `https://wa.me/526461510992?text=${encodeURIComponent(
            message
          )}`;


        window.open(
          whatsappUrl,
          "_blank",
          "noopener"
        );

      }
    );

  }

});
