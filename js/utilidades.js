  var pagina_actual = 1; 
  var cantidad_elementos_en_pagina = 0; 
  var cantidad_elementos_por_pagina = 8; 
  var contador_solicitudes = 0; 
  var cantidad_maxima_solicitudes = 7; 
  //var base_url = "http://micrositioroyalcanin.tk/"; 
  var base_url = "http://localhost/48_horas/"; 
  //var api_url = "http://api.xik.mx/api/"; 
  var api_url = "http://localhost:5003/api/"; 
  //var default_image_url = "http://micrositioroyalcanin.tk/images/camera.png"; 
  var default_image_url = "http://localhost/48_horas/images/camera.png"; 

  $(document).ready(function() {                    
          validar_accesos(); 

          //En caso de no ser un administrador, ocultaremos los botones de
          // descargar profesionales, certificados (clientes) y mascotas.
          if(Cookies.get("id_tipo_de_usuario")!=="1")
          {
            $("#div_descargar").hide(); 
            $("#div_registrar_profesional").hide(); 
          }

        });

function validar_accesos()
        {
            var url = window.location.pathname;            
            var filename = url.substring(url.lastIndexOf('/')+1);

            if(Cookies.get('id_usuario')==null)
            {
                //En este caso no ha iniciado sesión. Lo mandamos al Index. 
              if(!((filename==="index.html")||(filename==="")))
              {                
                window.location.href = `${base_url}`; 
              }          
              return;    
            }   

            //En caso de no haber leido los acuerdos todavía, lo mandamos a la página de acuerdos 
            //para aceptarlos. 
            if((Cookies.get('acuerdos_leidos')!=="1"))
            {
              if((filename==="ver_terminos_y_condiciones.html"))
                return; 
              window.location.href = `${base_url}/vistas/ver_terminos_y_condiciones.html`; 
              return;
            }

            //Si el Usuario no tiene sus datos completos, lo mandamos a su perfil para completar 
            //su información. 

            if((Cookies.get("datos_completos")==="0")&&(filename!=="actualizar_usuario.html"))
            {
              window.location.href = `${base_url}/vistas/usuarios/actualizar_usuario.html?id=${Cookies.get('id_usuario')}`; 
              return;     
            }



            //Si se encuentra en el index. Redirigirlo al perfil de usuario. 
            if((filename==="index.html")||(filename===""))
            {
              window.location.href = `${base_url}/vistas/usuarios/perfil_de_usuario.html?id=${Cookies.get('id_usuario')}`; 
              return;     
            }
            
        }

        function iniciar_sesion()
        {          
          //Hacemos una solicitud Ajax con los accesos. 
          var settings = {
           "async": false,
           "crossDomain": true,
           "url": `${api_url}/usuarios/getIniciarSesion`, 
           "method": "GET",
           "headers": {
             "Content-Type": "application/json",
             "cache-control": "no-cache",
             "email": $("#email").val(), 
             "secret": $("#secret").val()
           },
           "processData": false,                      
            success: function(data){  
            $("#errores").hide(); 
            if(data==="vacio")
            {
              var mensaje = "Nombre de usuario o contraseña incorrectos"; 
              $("#errores").html(mensaje); 
              $("#errores").show('slow'); 
              return; 
            }
            var obj = JSON.parse(data);    
            //Parseamos la información.
            Cookies.set('token', obj[0]["token"]);
            Cookies.set('id_usuario', obj[0]["id_usuario"]);
            Cookies.set('id_tipo_de_usuario', obj[0]["id_tipo_de_usuario"]);
            Cookies.set('acuerdos_leidos', obj[0]["acuerdos_leidos"]);
            Cookies.set('nombres_de_usuario', obj[0]["nombres_de_usuario"]);
            Cookies.set('tipo_de_usuario', obj[0]["tipo_de_usuario"]);
            Cookies.set('datos_completos', obj[0]["datos_completos"]);
            location.reload(); 

           }
           , error: function(data)
           {
              $("#errores").hide(); 
              var mensaje = "Hubo un error durante la conexión al servidor"; 
              $("#errores").show('slow'); 
           }
         }
      
         $.ajax(settings);

        }        

    function cerrar_sesion()
    {
      //Removemos las cookies. 
      Cookies.remove('id_usuario');
      Cookies.remove('token');
      Cookies.remove('id_tipo_de_usuario')

      //Cargamos nuevamente la página. 
      location.reload(); 
    }  

    
      function isUrlExists(url, cb){        
          jQuery.ajax({
              url:      url,
              async: false, 
              dataType: 'text',
              type:     'GET',              
              complete:  function(xhr){

                if(url===""){
                  cb.apply(this, [404]); 
                  return; 
                }

                if(typeof cb === 'function')
                     cb.apply(this, [xhr.status]);
              }
          });
      }  
      function correo_valido(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
      }

      function numero_valido(numero) {
        var re = /^(([0-9]+))$/;
        return re.test(String(numero).toLowerCase());
      }      

      function llenar_paginacion()
      {
        var append_paginacion = ""; 
        
        var append_paginacion = `<div class="col-12" style="text-align: right;"><ul>`; 

        //En caso de ser la página 1, no mostramos la fecha de anterior. 
        if(pagina_actual!=1)
        {
          append_paginacion += `<li class="button_paginacion" data-pagina="${pagina_actual-1}" onclick="actualizar_pagina(this);"><< Anterior</li>`; 

        }


        //Si hay mas élementos en la página, debemos cargar el siguiente. 
        if(cantidad_elementos_en_pagina>cantidad_elementos_por_pagina)
        {
          append_paginacion += `<li class="button_paginacion" data-pagina="${pagina_actual+1}" onclick="actualizar_pagina(this);">Siguiente >></li>`;      
        }

        append_paginacion+= `</ul></div>`; 
                          
        $("#paginacion").html(append_paginacion); 
      }


      function correo_cliente_inexistente(correo)
      {

        $("#loading").show(); 
        //Es un correo válido, no existe en la base de datos. 
        contador_solicitudes++;
        var settings = 
        {
           "async": false, 
           "crossDomain": true,
           "url": `${api_url}/clientes/getSearchByEmail`, 
           "method": "GET",
           "headers": {
             "Content-Type": "application/json",
             "cache-control": "no-cache",
             "email": `${correo}`, 
             "token": `${Cookies.get('token')}`, 
             "id_usuario": `${Cookies.get('id_usuario')}`
           },
           "processData": false,                      
            success: function(data)
            {    
              if(data==="incorrecto")
                correo_bool = true; 
              else
              {
                correo_bool = false; 
              
                //Parseamos la información. 
                var obj = JSON.parse(data);                
               
                cliente_buscado = obj[0]["cliente"]; 
                id_cliente_buscado = obj[0]["id"];
              }
           }
           , error: function() { }
         }
      
         $.ajax(settings);         
         $("#loading").hide();
         return correo_bool; 
      }

      function correo_usuario_inexistente(correo)
      {

        $("#loading").show(); 
        //Es un correo válido, no existe en la base de datos. 
        contador_solicitudes++;
        var settings = 
        {
           "async": false, 
           "crossDomain": true,
           "url": `${api_url}/usuarios/getSearchByEmail`, 
           "method": "GET",
           "headers": {
             "Content-Type": "application/json",
             "cache-control": "no-cache",
             "email": `${correo}`, 
             "token": `${Cookies.get('token')}`, 
             "id_usuario": `${Cookies.get('id_usuario')}`
           },
           "processData": false,                      
            success: function(data)
            {    
              if(data==="incorrecto")
                correo_bool = true; 
              else
              {
                correo_bool = false; 
              
                //Parseamos la información. 
                var obj = JSON.parse(data);                
               
                usuario_buscado = obj[0]["cliente"]; 
                id_usuario_buscado = obj[0]["id"];
              }
           }
           , error: function() { }
         }
      
         $.ajax(settings);         
         $("#loading").hide();
         return correo_bool; 
      }      

      function telefono_local_valido(telefono)
      {
        var re = /^(([0-9]{8}))$/;
        return re.test(String(telefono).toLowerCase())
      }

      function telefono_celular_valido(telefono)
      {
        var re = /^(([0-9]{10}))$/;
        return re.test(String(telefono).toLowerCase())
      }      

      function imprimir_cookie()
      {
        var señor = Cookies.get('name');
               
        alert(señor); 
      }

      function borrar_cookie()
      {
        //Cookies.remove('name', { path: '' });
        Cookies.remove('name');
      }  

 function getIdFromURL()
  {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var id = url.searchParams.get("id");
    return id;
  }  

  function getValueFromUrl(parametro)
  {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var id = url.searchParams.get(parametro);
    return id;
  }

    function habilitar_guardar_cambios()
      {

       if(Cookies.get('id_usuario')!==getValueFromUrl("id"))
       {
          //Si el usuario no es administrador, lo ocultamos. 
          if(Cookies.get('id_tipo_de_usuario')!=="1")
          {
            $("#div_guardar_cambios").hide(); 
          }
       }      
      }  

function quitar_loading()
{
  $("#loading").hide(); 
}  

function poner_loading()
{
  $("#loading").show(); 
}  

function descargar_de_url(url)
{
  var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.responseType = 'blob';

    request.onload = function() {
      // Only handle status code 200
      if(request.status === 200) {
        // Try to find out the filename from the content disposition `filename` value
        var disposition = request.getResponseHeader('Content-Disposition');        
        var matches = /(=[^"]*.xls)/.exec(disposition.toString());
        var archivo = matches[1].substr(1);
        
        var filename = (matches != null && archivo ? archivo : 'archivo.xls');

        // The actual download
        var blob = new Blob([request.response], { type: 'application/pdf' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
      }
      
      // some error handling should be done here...
    };

    request.send();

}

  function descargar_clientes()
  {
    descargar_de_url(`${api_url}/descargas/getClientes`); 
  }

  function descargar_kits()
  {
    descargar_de_url(`${api_url}/descargas/getKits`); 
  }

  function descargar_usuarios()
  {
    descargar_de_url(`${api_url}/descargas/getUsuarios`); 
  }

  function descargar_mascotas()
  {
    descargar_de_url(`${api_url}/descargas/getMascotas`); 
  }

  function llenar_encabezado()
  {
    var contenido_encabezado = 
    //Esconde en dispositivos más pequeños que md
`            <div class='d-none d-lg-block col-2 col-xm-2 encabezado_inicio'>` +
`            </div>` +
            //Se muestra solo en md.
`            <div class='d-md-none col-12 col-xl-7' style='text-align:center;background-color: white;'>` +
`                <img src='${base_url}/images/royal_canin_logo_02.jpg' style='padding-left:15px;margin-bottom:15px;height: 80px; width:auto; '>` +
`            </div>` +
              //Se muestra en mayores de md . 
`            <div class='d-none d-md-block col-12 col-md-6 col-lg-6 col-xl-7' style='background-color: white;'>` +
`                <img src='${base_url}/images/royal_canin_logo_02.jpg' style='padding-left:15px;margin-bottom:15px;height: 80px; width:auto; '>` +
`            </div>` +
            //Se muestra en mayores a md. 
`            <div class='d-none d-md-block col-12 col-md-6 col-lg-4 col-xl-3 fondo_perfil_encabezado'>` +
`                <div style="text-align:right;">
                 <img src='http://micrositioroyalcanin.tk/images/profile.png' style='height: 80px;position: absolute; top:7px; right:30px;padding:0px;margin-bottom:-100px;'>
                  <span class='letra_perfil_encabezado' style="position:absolute; right: 125px; bottom: 50px;">${Cookies.get("nombres_de_usuario")}</span>
                  <div class="letra_perfil_encabezado" style="position:absolute; right: 125px; bottom:32px;font-size:15px;">(${Cookies.get("tipo_de_usuario")})</div>
                  <div class="button_cerrar_sesion" onclick="cerrar_sesion()" style="position:absolute; right: 125px; bottom: 11px;">Cerrar Sesión</div>
            </div></div>` + 
            //Se muestra solo en el md.  
            `<div class='d-md-none col-12 fondo_perfil_encabezado' style="border-radius:0px;padding-top:10px;min-height:100px;">` +
`                <div style="text-align:center;">
                  <img src='http://micrositioroyalcanin.tk/images/profile.png' style='height: 80px;position: absolute; top:12px; right:30px;padding:0px;margin-bottom:-100px;'>
                  <span class='letra_perfil_encabezado' style="position:absolute; right: 125px; bottom: 50px;">${Cookies.get("nombres_de_usuario")}</span>
                  <div class="letra_perfil_encabezado" style="position:absolute; right: 125px; bottom:32px;font-size:15px;">(${Cookies.get("tipo_de_usuario")})</div>
                  <div class="button_cerrar_sesion" onclick="cerrar_sesion()" style="position:absolute; right: 125px; bottom: 11px;">Cerrar Sesión</div>
            </div></div>`            ; 

    $("#encabezado").html(contenido_encabezado); 
  }

  function llenar_menu()
  {
    var ocultar = ""; 
    if(Cookies.get("id_tipo_de_usuario")!=="1")
    {
        ocultar = "style='display:none;'"; 
    }

      var contenido_menu = `<div class='row'>  
                    <div id='button_ver_perfil' class='col-12 button_menu' onclick='window.location.href="${base_url}/vistas/usuarios/perfil_de_usuario.html?id=${Cookies.get('id_usuario')}"'>   
                        <img id='button_perfil' src='${base_url}/images/user.png' style='margin-right: 10px;' height='40' width='40'>   
                        Mi Perfil
                    </div>   
                    <div id='button_ver_clientes' class='col-12 button_menu' onclick='window.location.href="${base_url}/vistas/clientes/ver_clientes.html"'>   
                        <img id='button_clientes' src='${base_url}/images/certificate.png' style='margin-right: 10px;' height='40' width='40'>   
                        Certificados
                    </div>   
                    <div id='button_ver_usuarios' class='col-12 button_menu' onclick='window.location.href="${base_url}/vistas/usuarios/ver_usuarios.html"'>   
                        <img src='${base_url}/images/criadores.png' style='margin-right: 10px;' height='40' width='40'>   
                        Profesionales   
                    </div>                       
                    <div id='button_ver_mascotas' onclick='window.location.href="${base_url}/vistas/mascotas/ver_mascotas.html"' class='col-12 button_menu'>   
                        <img src='${base_url}/images/mascotas.png' style='margin-right: 10px;' height='40' width='40'>   
                        Mascotas
                    </div>   
                    <div id='button_ver_tipos_de_mascotas' ${ocultar} onclick='window.location.href="${base_url}/vistas/tipos_de_mascota/ver_tipos_de_mascota.html"' class='col-12 button_menu'>   
                        <img src='${base_url}/images/dog.png' style='margin-right: 10px;' height='40' width='40'>   
                        Tipos de Mascotas   
                    </div>   
                    <div id='button_ver_kits' onclick='window.location.href="${base_url}/vistas/kits/ver_kits.html"' class='col-12 button_menu'>   
                        <img src='${base_url}/images/kits.png' style='margin-right: 10px;' height='40' width='40'> Kits  
                    </div>   
                </div>`   
      $("#menu").html(contenido_menu);  
  }

      function poner_fecha_de_hoy(id_elemento)
      {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
            dd = '0'+dd
        } 

        if(mm<10) {
            mm = '0'+mm
        } 

        today = mm + '/' + dd + '/' + yyyy;
        today = `${yyyy}-${mm}-${dd}`;


        $("#" + id_elemento).val(today);      
      }      