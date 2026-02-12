
import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  PieChart,
  Target,
  Flag,
  Calculator,
  Sunrise,
  Settings,
  ShieldCheck,
  FileText,
  Bot,
  CreditCard,
  BarChart2,
  Tags,
  LogOut,
  Bell,
  Grid
} from 'lucide-react';
import { ViewState } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard' as ViewState, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },

  { id: 'transactions' as ViewState, label: 'Transações', icon: <ArrowRightLeft size={20} /> },
  // { id: 'transfers' as ViewState, label: 'Transferências', icon: <ArrowRightLeft size={20} /> }, // Removed
  { id: 'credit-cards' as ViewState, label: 'Cartões', icon: <CreditCard size={20} /> },
  { id: 'accounts' as ViewState, label: 'Contas', icon: <Wallet size={20} /> },
  { id: 'budgets' as ViewState, label: 'Orçamento', icon: <PieChart size={20} /> },
  { id: 'charts' as ViewState, label: 'Gráficos', icon: <BarChart2 size={20} /> },
  { id: 'categories' as ViewState, label: 'Categorias', icon: <Tags size={20} /> },
  { id: 'goals' as ViewState, label: 'Metas', icon: <Target size={20} /> },
  { id: 'objectives' as ViewState, label: 'Objetivos', icon: <Flag size={20} /> },
  { id: 'simulator' as ViewState, label: 'Simulador', icon: <Calculator size={20} /> },
  { id: 'retirement' as ViewState, label: 'Aposentadoria', icon: <Sunrise size={20} /> },
  { id: 'ai-assistant' as ViewState, label: 'Assistente Virtual', icon: <Bot size={20} /> },
  { id: 'reports' as ViewState, label: 'Relatórios', icon: <FileText size={20} /> },
  { id: 'plans' as ViewState, label: 'Planos', icon: <ShieldCheck size={20} /> },
  { id: 'settings' as ViewState, label: 'Configurações', icon: <Settings size={20} /> },
];

export const CATEGORIES_MAP: Record<string, string[]> = {
  'Alimentação': ['Supermercado', 'Restaurante', 'Lanche', 'Feira'],
  'Transporte': ['Combustível', 'Uber/Taxi', 'Ônibus/Metrô', 'Manutenção'],
  'Lazer': ['Cinema', 'Viagens', 'Hobbies', 'Shows'],
  'Saúde': ['Farmácia', 'Consulta', 'Exames', 'Academia'],
  'Educação': ['Cursos', 'Livros', 'Mensalidade Escolar'],
  'Moradia': ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet'],
  'Investimentos': ['Ações', 'Renda Fixa', 'Cripto', 'Reserva'],
  'Outros': ['Diversos', 'Presentes', 'Taxas']
};

export const INCOME_CATEGORIES_MAP: Record<string, string[]> = {
  'Salário': ['Mensal', 'Adiantamento', '13º Salário', 'Férias'],
  'Freelance': ['Projeto', 'Consultoria', 'Serviço Extra'],
  'Investimentos': ['Dividendos', 'Juros', 'Aluguel (FIIs)', 'Venda de Ativos'],
  'Presentes': ['Aniversário', 'Doação'],
  'Outros': ['Reembolso', 'Venda de Itens', 'Diversos']
};

export const CATEGORIES = Object.keys(CATEGORIES_MAP);

export interface BankInfo {
  id: string;
  name: string;
  color: string;
  logoUrl: string;
}

export const BANKS: BankInfo[] = [
  // Coluna Esquerda - Bancos Tradicionais
  { id: 'itau', name: 'Itaú', color: '#EC7000', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/itau.svg' },
  { id: 'nubank', name: 'Nubank', color: '#8A05BE', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/nubank.svg' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/bradesco.svg' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FCF200', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/bancodobrasil.svg' },
  { id: 'santander', name: 'Santander', color: '#EC0000', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/santander.svg' },
  { id: 'caixa', name: 'Caixa', color: '#005CA9', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/caixa.svg' },
  { id: 'inter', name: 'Inter', color: '#FF7A00', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/inter.svg' },
  { id: 'c6', name: 'C6 Bank', color: '#222222', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/c6bank.svg' },
  { id: 'safra', name: 'Safra', color: '#AF9049', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/safra.svg' },
  { id: 'pan', name: 'Banco Pan', color: '#00AEEF', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/pan.svg' },
  { id: 'pagbank', name: 'PagBank', color: '#35C24D', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/pagseguro.svg' },

  // Coluna Direita - Corretoras
  { id: 'xp', name: 'XP Investimentos', color: '#000000', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/xp.svg' },
  { id: 'rico', name: 'Rico', color: '#FF4500', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/rico.svg' },
  { id: 'clear', name: 'Clear', color: '#00FFFF', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/clear.svg' },
  { id: 'avenue', name: 'Avenue', color: '#003A70', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/avenue.svg' },
  { id: 'warren', name: 'Warren', color: '#EE2E5D', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/warren.svg' },
  { id: 'toro', name: 'Toro Investimentos', color: '#6227B1', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/toro.svg' },
  { id: 'nuinvest', name: 'NuInvest', color: '#8A05BE', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/easynvest.svg' },
  { id: 'modalmais', name: 'Modalmais', color: '#141414', logoUrl: 'https://cdn.jsdelivr.net/gh/yurijserrano/financicons@main/svg/modalmais.svg' },

  // Bandeiras / Benefícios
  { id: 'visa', name: 'Visa', color: '#1A1F71', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
  { id: 'mastercard', name: 'Mastercard', color: '#EB001B', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
  { id: 'elo', name: 'Elo', color: '#00A4E0', logoUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23111111"/%3E%3Cg transform="matrix(0.65 0 0 0.65 17.5 17.5)"%3E%3Cpath fill="%2300A4E0" d="M35.6 28.4c-9.6 0-17.4 7.8-17.4 17.4 0 4.1 1.4 7.9 3.8 10.9l-7.2 7.2C8.6 56.6 5 47.9 5 38.3 5 21 19 7 36.3 7c7.9 0 15.2 2.9 20.9 7.7L50 21.9c-4-2.2-8.6-3.5-13.4-3.5h-1z"/%3E%3Cpath fill="%23FFCD00" d="M64.4 28.4c-4.8 0-9.4 1.3-13.4 3.5l-7.2-7.2C49.5 19.9 56.8 17 64.7 17c17.3 0 31.3 14 31.3 31.3 0 9.6-3.6 18.3-9.8 24.8l-7.2-7.2c2.4-3 3.8-6.8 3.8-10.9 0-9.6-7.8-17.4-17.4-17.4h-1z"/%3E%3Cpath fill="%23EB001B" d="M64.4 71.6c9.6 0 17.4-7.8 17.4-17.4 0-4.1-1.4-7.9-3.8-10.9l7.2-7.2C91.4 43.4 95 52.1 95 61.7c0 17.3-14 31.3-31.3 31.3-7.9 0-15.2-2.9-20.9-7.7L50 78.1c4 2.2 8.6 3.5 13.4 3.5h1z"/%3E%3Cpath fill="%23FFFFFF" d="M50 50m-13.5 2.1c0-4.6 2.3-7 6.4-7 4.5 0 6.6 2.6 6.6 8.3v.4H35.8c.2 4.1 2.3 5.4 5.3 5.4 2.2 0 3.8-.7 4.8-1.7l3.1 3c-2.1 2.6-5.1 3.7-8.2 3.7-7 0-10.4-4-10.4-10.1 0-7.2 4-11.7 10.6-11.7 6.7 0 10.4 4.5 10.4 11.2 0 .8-.1 1.7-.2 2.1H36.5v-.5zm10.7-5.1c0-2-1-4.2-3.4-4.2-2.4 0-3.5 1.9-3.7 4.2h7.1zM64 39.7h4.2v23.6H64V39.7zM77.1 63.8c-6.8 0-10.7-4.6-10.7-11.7 0-7.2 3.9-11.8 10.7-11.8 6.9 0 10.7 4.7 10.7 11.8 0 7-3.9 11.7-10.7 11.7zm0-4.1c4.3 0 6.4-3 6.4-7.6 0-4.6-2.1-7.6-6.4-7.6-4.3 0-6.4 3-6.4 7.6 0 4.6 2.1 7.6 6.4 7.6z"/%3E%3C/g%3E%3C/svg%3E' },
  { id: 'amex', name: 'American Express', color: '#2E77BC', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg' },
  { id: 'hipercard', name: 'Hipercard', color: '#BE0000', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Hipercard_logo.svg' },
  { id: 'ticket', name: 'Ticket', color: '#CE0058', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Ticket_logo_2016.svg' }, // Updated Link
  { id: 'alelo', name: 'Alelo', color: '#006748', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Alelo_logo.svg' },
  { id: 'sodexo', name: 'Sodexo', color: '#5C5FBA', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Sodexo_logo.svg' },
  { id: 'vr', name: 'VR Benefícios', color: '#00AA13', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/VR_Benef%C3%ADcios_logo.png' }, // Fallback to PNG or find SVG. Using external consistent link if possible.

  // Especiais
  {
    id: 'carteira',
    name: 'Carteira (Dinheiro)',
    color: '#334155',
    logoUrl: 'data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100" height="100" rx="20" fill="%23334155"/%3E%3Crect x="20" y="30" width="60" height="40" rx="5" fill="%2364748b"/%3E%3Ccircle cx="65" cy="50" r="8" fill="%23334155"/%3E%3C/svg%3E'
  },
  {
    id: 'outro',
    name: 'Outro',
    color: '#64748b',
    logoUrl: 'data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100" height="100" rx="20" fill="%2364748b"/%3E%3Cpolygon points="50,20 70,40 70,80 30,80 30,40" fill="white"/%3E%3C/svg%3E'
  }
];

export const CARD_NETWORKS = BANKS.filter(b => ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'ticket', 'alelo', 'sodexo', 'vr'].includes(b.id));

// Automatic deployment trigger: 2026-02-09 21:14:14
