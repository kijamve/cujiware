import type { APIRoute } from 'astro';
import prisma from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../../../lib/email';

interface RegisterData {
  email: string;
  country: string;
  billing_full_name?: string;
  billing_tax_id?: string;
  billing_address?: string;
  billing_phone?: string;
  name?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json() as RegisterData;
    const { email, country } = data;

    if (!email || !country) {
      return new Response(
        JSON.stringify({
          error: 'El email y el país son requeridos'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validar campos de facturación para Venezuela
    if (country === 'VE') {
      if (!data.billing_tax_id) {
        return new Response(
          JSON.stringify({
            error: 'El documento de identidad es requerido'
          }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Si es persona jurídica, validar campos adicionales y RIF
      if (data.billing_full_name) {
        if (!data.billing_address || !data.billing_phone) {
          return new Response(
            JSON.stringify({
              error: 'Todos los campos de facturación son requeridos para persona jurídica'
            }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }

        // Validar RIF
        function validateRIF(rif: string): boolean {
          if (!rif || rif.length < 2) return false;
          
          // Limpiar RIF: solo letras y números
          const cleanRIF = rif.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const type = cleanRIF[0];
          const ci = cleanRIF.slice(1);
          
          function ci_to_rif(type: string, ci: string): string | false {
            if (ci.length > 9) return false;

            let count_digits = ci.length;
            if(count_digits == 9) count_digits--;

            const calc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const constants = [4, 3, 2, 7, 6, 5, 4, 3, 2];

            if(type == "V") calc[0] = 1;
            else if(type == "E") calc[0] = 2;
            else if(type == "J") calc[0] = 3;
            else if(type == "P") calc[0] = 4;
            else if(type == "G") calc[0] = 5;
            else return false;

            let sum = calc[0] * constants[0];
            let index = constants.length - 1;

            for(let i = count_digits - 1; i >= 0; i--) {
              const digit = calc[index] = parseInt(ci[i]);
              sum += digit*constants[index--];
            }

            let final_digit = sum%11;
            if(final_digit>1) final_digit = 11 - final_digit;

            let final_digit_legal: number = 0;
            if (ci.length == 9) {
              final_digit_legal = parseInt(ci[8]);
              if (final_digit_legal!=final_digit && final_digit_legal!=0) return false;
            }

            calc[9] = (ci.length == 9) ? final_digit_legal : final_digit;

            let rif = type;
            for(let i = 1; i < calc.length; ++i) rif += calc[i];

            return rif;
          }

          const validRIF = ci_to_rif(type, ci);
          return validRIF !== false && validRIF === cleanRIF;
        }

        if (!validateRIF(data.billing_tax_id)) {
          return new Response(
            JSON.stringify({
              error: 'El RIF ingresado no es válido'
            }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      // Si es persona natural, validar nombre
      else if (!data.name) {
        return new Response(
          JSON.stringify({
            error: 'El nombre es requerido para persona natural'
          }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: 'El email ya está registrado'
        }),
        { status: 400 }
      );
    }

    // Generar contraseña aleatoria
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: country === 'VE' && data.name ? data.name : email.split('@')[0],
        country,
        billing_full_name: country === 'VE' ? data.billing_full_name : undefined,
        billing_tax_id: country === 'VE' ? data.billing_tax_id : undefined,
        billing_address: country === 'VE' ? data.billing_address : undefined,
        billing_phone: country === 'VE' ? data.billing_phone : undefined
      }
    });

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country
      },
      import.meta.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Establecer cookie
    cookies.set('token', token, {
      path: '/',
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    // Enviar email de bienvenida
    await sendWelcomeEmail(email, password);

    return new Response(
      JSON.stringify({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          country: user.country
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `token=${token}; Path=/; Max-Age=604800; SameSite=Lax` // 7 días
        }
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 