
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
  Tags
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
  { id: 'elo', name: 'Elo', color: '#00A4E0', logoUrl: 'https://raw.githubusercontent.com/guilhermerodz/input-card/master/assets/images/elo.svg' },
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
