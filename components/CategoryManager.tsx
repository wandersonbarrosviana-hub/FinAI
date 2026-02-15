
import React, { useState, useEffect } from 'react';
import {
    Plus,
    MoreVertical,
    Trash2,
    Edit2,
    Save,
    X,
    FolderOpen,
    ShoppingBag,
    Briefcase,
    Home,
    Utensils,
    Car,
    Plane,
    Heart,
    BookOpen,
    DollarSign,
    Coffee,
    Smartphone,
    Gift,
    Music,
    Film,
    Zap,
    Droplet,
    Wifi,
    Monitor,
    Gamepad,
    Dumbbell,
    GraduationCap,
    Hammer,
    Baby,
    Dog,
    Cat,
    Fish,
    Bus,
    Train,
    Bike,
    CreditCard,
    Banknote,
    Landmark,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertCircle,
    Anchor,
    Archive,
    Award,
    Backpack,
    Bath,
    Beer,
    Bell,
    Bike as Bicycle,
    Bird,
    Bitcoin,
    Book,
    Box,
    Brain,
    Brush,
    Bug,
    Building,
    BusFront,
    Cake,
    Calculator,
    Calendar,
    Camera,
    Candy,
    CarFront,
    Carrot,
    Castle,
    Cat as CatIcon,
    Check,
    CheckCircle,
    ChefHat,
    Cherry,
    ChevronDown,
    ChevronUp,
    CircleDollarSign,
    Cloud,
    CloudRain,
    CloudSun,
    Code,
    Coins,
    Compass,
    ConciergeBell,
    Construction,
    Contact,
    Cookie,
    Copy,
    Copyright,
    CornerDownRight,
    Cpu,
    Croissant,
    Crosshair,
    Crown,
    CupSoda,
    Database,
    Diamond,
    Dice1,
    Dna,
    Dog as DogIcon,
    DoorOpen,
    Download,
    Dribbble,
    Drumstick,
    Ear,
    Egg,
    Eye,
    Factory,
    Fan,
    Feather,
    FerrisWheel,
    File,
    FileText,
    Filter,
    Flame,
    Flashlight,
    Flower,
    Flower2,
    Focus,
    Folder,
    Footprints,
    Forklift,
    Frown,
    Fuel,
    FunctionSquare,
    Gamepad2,
    Gem,
    Ghost,
    Gift as GiftIcon,
    GitBranch,
    Glasses,
    Globe,
    Grab,
    GraduationCap as GradCap,
    Grape,
    Grid,
    Hammer as HammerIcon,
    HandCoins,
    HardDrive,
    Hash,
    Haze,
    Headphones,
    HeartHandshake,
    HeartPulse,
    HelpCircle,
    Hexagon,
    Highlighter,
    History,
    Home as HomeIcon,
    Hourglass,
    IceCream,
    Image,
    Inbox,
    Infinity,
    Info,
    InspectionPanel,
    Instagram,
    Italic,
    Joystick,
    Key,
    Keyboard,
    Lamp,
    Landmark as LandmarkIcon,
    Languages,
    Laptop,
    Laptop2,
    Layers,
    Layout,
    LayoutDashboard,
    LayoutGrid,
    Leaf,
    Library,
    LifeBuoy,
    Lightbulb,
    Link,
    Linkedin,
    List,
    ListChecks,
    ListMusic,
    ListOrdered,
    ListPlus,
    ListTodo,
    ListVideo,
    ListX,
    Loader,
    Loader2,
    Lock,
    LockKeyhole,
    LogIn,
    LogOut,
    Lollipop,
    Luggage,
    Magnet,
    Mail,
    Mailbox,
    Map,
    MapPin,
    Martini,
    Maximize,
    Maximize2,
    Medal,
    Megaphone,
    Menu,
    MessageCircle,
    MessageSquare,
    Mic,
    Mic2,
    Microscope,
    Microwave,
    Milestone,
    Milk,
    Minimize,
    Minimize2,
    Minus,
    MinusCircle,
    Monitor as MonitorIcon,
    Moon,
    MoreHorizontal,
    Mountain,
    MountainSnow,
    Mouse,
    Move,
    Move3d,
    MoveDiagonal,
    MoveDiagonal2,
    MoveHorizontal,
    MoveVertical,
    Music2,
    Music3,
    Music4,
    Navigation,
    Network,
    Newspaper,
    Nfc,
    Nut,
    Octagon,
    Option,
    Orbit,
    Origami,
    Package,
    Package2,
    PackageCheck,
    PackageMinus,
    PackageOpen,
    PackagePlus,
    PackageSearch,
    PackageX,
    PaintBucket,
    Paintbrush,
    Paintbrush2,
    Palette,
    Palmtree,
    PanelBottom,
    PanelLeft,
    PanelRight,
    PanelTop,
    Paperclip,
    Parentheses,
    PartyPopper,
    Pause,
    PauseCircle,
    PawPrint,
    Pen,
    PenLine,
    PenTool,
    Pencil,
    PencilLine,
    PencilRuler,
    Percent,
    PersonStanding,
    Phone,
    PhoneCall,
    PhoneForwarded,
    PhoneIncoming,
    PhoneMissed,
    PhoneOff,
    PhoneOutgoing,
    Phone as PhoneIcon,
    PieChart,
    PiggyBank as Piggy,
    Pilcrow,
    Pill,
    Pin,
    PinOff,
    Pipette,
    Pizza,
    Plane as PlaneIcon,
    PlaneLanding,
    PlaneTakeoff,
    Play,
    PlayCircle,
    Plug,
    Plug2,
    PlusCircle,
    PlusSquare,
    Pocket,
    Podcast,
    Pointer,
    Popcorn,
    Popsicle,
    PoundSterling,
    Power,
    PowerOff,
    Presentation,
    Printer,
    Projector,
    Puzzle,
    QrCode,
    Quote,
    Rabbit,
    Radar,
    Radiation,
    Radio,
    RadioReceiver,
    RadioTower,
    Radius,
    RailSymbol,
    Rainbow,
    Rat,
    Ratio,
    Receipt,
    RectangleHorizontal,
    RectangleVertical,
    Recycle,
    Redo,
    Redo2,
    RefreshCcw,
    RefreshCw,
    Refrigerator,
    Regex,
    RemoveFormatting,
    Repeat,
    Repeat1,
    Repeat2,
    Replace,
    ReplaceAll,
    Reply,
    ReplyAll,
    Rewind,
    Rocket,
    RockingChair,
    RollerCoaster,
    Rotate3d,
    RotateCcw,
    RotateCw,
    Route,
    Router,
    Rows,
    Rss,
    Ruler,
    RussianRuble,
    Sailboat,
    Salad,
    Sandwich,
    Satellite,
    SatelliteDish,
    Save as SaveIcon,
    SaveAll,
    Scale,
    Scale3d,
    Scaling,
    Scan,
    ScanBarcode,
    ScanEye,
    ScanFace,
    ScanLine,
    ScanSearch,
    ScanText,
    ScatterChart,
    School,
    School2,
    Scissors,
    ScreenShare,
    ScreenShareOff,
    Scroll,
    ScrollText,
    SearchCheck,
    SearchCode,
    SearchSlash,
    SearchX,
    Send,
    SeparatorHorizontal,
    SeparatorVertical,
    Server,
    ServerCog,
    ServerCrash,
    ServerOff,
    Settings,
    Settings2,
    Share,
    Share2,
    Sheet,
    Shell,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldClose,
    ShieldOff,
    ShieldQuestion,
    Ship,
    ShipWheel,
    Shirt,
    ShoppingBag as ShoppingBagIcon,
    ShoppingBasket,
    ShoppingCart,
    Shovel,
    ShowerHead,
    Shrink,
    Shuffle,
    Sigma,
    Signal,
    SignalHigh,
    SignalLow,
    SignalMedium,
    SignalZero,
    Siren,
    SkipBack,
    SkipForward,
    Skull,
    Slack,
    Slash,
    Slice,
    Sliders,
    SlidersHorizontal,
    Smartphone as SmartphoneIcon,
    SmartphoneCharging,
    SmartphoneNfc,
    Smile,
    SmilePlus,
    Snowflake,
    Sofa,
    Soup,
    Space,
    Spade,
    Sparkle,
    Sparkles,
    Speaker,
    Speech,
    SpellCheck,
    Spline,
    Split,
    SplitSquareHorizontal,
    SplitSquareVertical,
    SprayCan,
    Sprout,
    Square,
    SquareAsterisk,
    SquareCode,
    SquareDashedBottom,
    SquareDashedBottomCode,
    SquareDot,
    SquareEqual,
    SquareSlash,
    SquareStack,
    SquareUser,
    SquareUserRound,
    Stamp,
    Star,
    StarHalf,
    StarOff,
    StepBack,
    StepForward,
    Stethoscope,
    Sticker,
    StickyNote,
    StopCircle,
    Store,
    StretchHorizontal,
    StretchVertical,
    Strikethrough,
    Subscript,
    Subtitles,
    Sun,
    SunDim,
    SunMedium,
    SunMoon,
    SunSnow,
    Sunrise,
    Sunset,
    Superscript,
    SwissFranc,
    SwitchCamera,
    Sword,
    Swords,
    Syringe,
    Table,
    Table2,
    Tablet,
    TabletSmartphone,
    Tag,
    Tags,
    Target,
    Tent,
    TentTree,
    Terminal,
    TerminalSquare,
    TestTube,
    TestTube2,
    Text,
    TextCursor,
    TextCursorInput,
    TextQuote,
    TextSelect,
    Theater,
    Thermometer,
    ThermometerSnowflake,
    ThermometerSun,
    ThumbsDown,
    ThumbsUp,
    Ticket,
    Timer,
    TimerOff,
    TimerReset,
    ToggleLeft,
    ToggleRight,
    Tornado,
    Torus,
    Touchpad,
    TouchpadOff,
    TowerControl,
    ToyBrick,
    Tractor,
    TrafficCone,
    TrainFront,
    TrainTrack,
    TramFront,
    Trash,
    Trash2 as TrashIcon,
    TreeDeciduous,
    TreePine,
    Trees,
    Trello,
    TrendingUp as TrendingUpIcon,
    Triangle,
    Trophy,
    Truck,
    Tv,
    Tv2,
    Twitch,
    Twitter,
    Type,
    Umbrella,
    Underline,
    Undo,
    Undo2,
    UnfoldHorizontal,
    UnfoldVertical,
    Ungroup,
    Unlink,
    Unlink2,
    Unlock,
    UnlockKeyhole,
    Upload,
    UploadCloud,
    Usb,
    User,
    UserCheck,
    UserCog,
    UserMinus,
    UserPlus,
    UserX,
    Users,
    Users2,
    Utensils as UtensilsIcon,
    UtensilsCrossed,
    UtilityPole,
    Variable,
    Vault,
    Vegan,
    VenetianMask,
    Vibrate,
    VibrateOff,
    Video,
    VideoOff,
    Videotape,
    View,
    Voicemail,
    Volume,
    Volume1,
    Volume2,
    VolumeX,
    Vote,
    Wallet,
    Wallet2,
    WalletCards,
    Wallpaper,
    Wand,
    Wand2,
    Warehouse,
    WashingMachine,
    Watch,
    Waves,
    Waypoints,
    Webcam,
    Webhook,
    Weight,
    Wheat,
    WheatOff,
    WholeWord,
    Wifi as WifiIcon,
    WifiOff,
    Wind,
    Wine,
    WineOff,
    Workflow,
    WrapText,
    Wrench,
    X as XIcon,
    XCircle,
    XSquare,
    Youtube,
    Zap as ZapIcon,
    ZapOff,
    Search,
    ZoomIn,
    ChevronRight
} from 'lucide-react';
import { Transaction } from '../types';
import { CATEGORIES_MAP } from '../constants';

interface CategoryManagerProps {
    transactions: Transaction[];
}

interface CategoryState {
    [category: string]: string[];
}

interface IconState {
    [key: string]: string;
}

// Extensive Icon Map
const ICON_MAP: any = {
    ShoppingBag, Briefcase, Home, Utensils, Car, Plane, Heart, BookOpen,
    DollarSign, Coffee, Smartphone, Gift, Music, Film, Zap, Droplet,
    Wifi, Monitor, Gamepad, Dumbbell, GraduationCap, Hammer, Baby, Dog,
    Cat, Fish, Bus, Train, Bike, CreditCard, Banknote, Landmark, PiggyBank,
    TrendingUp, TrendingDown, Activity, AlertCircle, Award, Beer, Bell,
    Calendar, Camera, CheckCircle, Cloud, Code, Coins, Crown, Database,
    Diamond, Eye, Factory, FileText, FolderOpen, Flame, Flashlight,
    Flower, Ghost, Globe, Headphones, Image, Key, Laptop, Layers, Layout,
    Lightbulb, Link, Lock, Mail, MapPin, Medal, MessageCircle, Mic, Moon,
    Mouse, Package, Paintbrush, Palette, Paperclip, Phone, PieChart,
    PlayCircle, Power, Printer, Puzzle, Radio, Rocket, Ruler, Save: SaveIcon,
    Scissors, Search, Server, Settings, Share, Shield, Shirt, ShoppingCart,
    Signal, Skull, Smile, Speaker, Star, Sun, Table, Tag, Target, Terminal,
    Thermometer, ThumbsUp, Ticket, Timer, Tool: Wrench, Trash: TrashIcon,
    Trophy, Truck, Tv, Umbrella, Unlock, Upload, User, Users, Video,
    Wallet, Watch, WifiIcon, Wrench, ZapIcon, ZoomIn
};

const ICON_KEYS = Object.keys(ICON_MAP).sort();

const CategoryManager: React.FC<CategoryManagerProps> = ({ transactions }) => {
    // Load initial categories
    const [categories, setCategories] = useState<CategoryState>(() => {
        const saved = localStorage.getItem('finai_categories');
        return saved ? JSON.parse(saved) : CATEGORIES_MAP;
    });

    // Load Icons
    const [icons, setIcons] = useState<IconState>(() => {
        const saved = localStorage.getItem('finai_category_icons');
        return saved ? JSON.parse(saved) : {};
    });

    // UI States
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Editing / Creating States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<'category' | 'subcategory' | null>(null);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [editValue, setEditValue] = useState('');
    const [newValue, setNewValue] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('ShoppingBag');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem('finai_categories', JSON.stringify(categories));
        window.dispatchEvent(new Event('storage'));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('finai_category_icons', JSON.stringify(icons));
    }, [icons]);

    // --- Helpers ---
    const calculateTotal = (category: string, subCategory?: string) => {
        // transactions passed are ALREADY filtered by Global Date from App.tsx
        return transactions
            .filter(t => {
                if (t.type !== 'expense') return false;
                if (subCategory) return t.category === category && t.subCategory === subCategory;
                return t.category === category;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    const getIcon = (key: string) => {
        const iconName = icons[key];
        const IconComponent = ICON_MAP[iconName] || FolderOpen;
        return <IconComponent size={24} className="text-sky-600" />;
    };

    // --- CRUD Operations ---

    // 1. Add Category
    const handleAddCategory = () => {
        if (!newValue.trim()) return;
        if (categories[newValue]) return alert('Categoria já existe!');

        setCategories(prev => ({ ...prev, [newValue]: [] }));
        setIcons(prev => ({ ...prev, [newValue]: selectedIcon }));
        closeModal();
    };

    // 2. Add Subcategory
    const handleAddSubcategory = () => {
        if (!newValue.trim()) return;
        if (!targetCategory) return;
        const currentSubs = categories[targetCategory] || [];
        if (currentSubs.includes(newValue)) return alert('Subcategoria já existe!');

        setCategories(prev => ({
            ...prev,
            [targetCategory]: [...currentSubs, newValue]
        }));
        setIcons(prev => ({ ...prev, [`${targetCategory}-${newValue}`]: selectedIcon }));
        closeModal();
    };

    // 3. Edit (Rename)
    const handleEdit = () => {
        if (!newValue.trim()) return;

        if (editingType === 'category') {
            const subs = categories[editValue];
            const newCats = { ...categories };
            delete newCats[editValue];
            newCats[newValue] = subs;
            setCategories(newCats);

            // Update Icon Key
            const newIcons = { ...icons };
            newIcons[newValue] = selectedIcon; // Update icon
            if (editValue !== newValue) delete newIcons[editValue];
            setIcons(newIcons);

        } else if (editingType === 'subcategory') {
            const subs = categories[targetCategory].map(s => s === editValue ? newValue : s);
            setCategories(prev => ({ ...prev, [targetCategory]: subs }));

            // Update Icon Key
            const newIcons = { ...icons };
            newIcons[`${targetCategory}-${newValue}`] = selectedIcon;
            if (editValue !== newValue) delete newIcons[`${targetCategory}-${editValue}`];
            setIcons(newIcons);
        }
        closeModal();
    };

    // 4. Delete
    const handleDelete = (type: 'category' | 'subcategory', cat: string, sub?: string) => {
        if (!confirm('Tem certeza? Isso pode afetar a visualização de transações antigas.')) return;

        if (type === 'category') {
            const newCats = { ...categories };
            delete newCats[cat];
            setCategories(newCats);
            // Clean icons? Maybe, but low priority.
        } else {
            const subs = categories[cat].filter(s => s !== sub);
            setCategories(prev => ({ ...prev, [cat]: subs }));
        }
    };


    // --- UI Handlers ---
    const openAddCategoryModal = () => {
        setEditingType('category');
        setEditValue('');
        setNewValue('');
        setSelectedIcon('ShoppingBag');
        setIsModalOpen(true);
    };

    const openAddSubModal = (cat: string) => {
        setEditingType('subcategory');
        setTargetCategory(cat);
        setEditValue(''); // New (no old value)
        setNewValue('');
        setSelectedIcon('ShoppingBag');
        setIsModalOpen(true);
    };

    const openEditModal = (type: 'category' | 'subcategory', cat: string, sub?: string) => {
        setEditingType(type);
        setTargetCategory(cat);
        setEditValue(sub || cat);
        setNewValue(sub || cat);
        // Load existing icon
        const key = sub ? `${cat}-${sub}` : cat;
        setSelectedIcon(icons[key] || 'ShoppingBag');

        setIsModalOpen(true);
        setMenuOpenId(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        setMenuOpenId(null);
    };

    const filteredIconKeys = ICON_KEYS.filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));


    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Categorias</h2>
                    <p className="text-slate-500 text-sm font-medium">Organize seus gastos e receitas.</p>
                </div>
                <button
                    onClick={openAddCategoryModal}
                    className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 font-bold"
                >
                    <Plus size={20} />
                    <span>Nova Categoria</span>
                </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.entries(categories) as [string, string[]][]).map(([category, subcategories]) => {
                    const catTotal = calculateTotal(category);
                    const isExpanded = expandedCategory === category;

                    return (
                        <div
                            key={category}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-xl hover:shadow-sky-100/40 hover:-translate-y-1"
                        >
                            {/* Decorative Background Icon */}
                            <div className="absolute -bottom-6 -right-6 text-slate-100/50 transform rotate-12 pointer-events-none">
                                {(() => {
                                    const iconName = icons[category];
                                    const IconComponent = ICON_MAP[iconName] || FolderOpen;
                                    return <IconComponent size={120} />;
                                })()}
                            </div>

                            {/* Card Content */}
                            <div className="relative z-10">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
                                            {getIcon(category)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{category}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{subcategories.length} subcategorias</p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpenId(menuOpenId === `cat-${category}` ? null : `cat-${category}`)}
                                            className="p-2 text-slate-300 hover:text-sky-600 transition-colors rounded-xl hover:bg-sky-50"
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {/* Menu */}
                                        {menuOpenId === `cat-${category}` && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in-95 overflow-hidden">
                                                <button
                                                    onClick={() => openEditModal('category', category)}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                                >
                                                    <Edit2 size={14} /> Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('category', category)}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="mb-6">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Total Gasto</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-slate-400">R$</span>
                                        <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                            {catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 mb-4"></div>

                                {/* Subcategories Toggle */}
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors uppercase tracking-wider mb-2"
                                >
                                    <span>Ver Subcategorias</span>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {/* Expanded List */}
                                {isExpanded && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        {subcategories.map(sub => (
                                            <div key={sub} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group/sub">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-slate-300 group-hover/sub:text-sky-500 transition-colors">
                                                        {(() => {
                                                            const key = `${category}-${sub}`;
                                                            const iconName = icons[key];
                                                            const IconComponent = ICON_MAP[iconName] || FolderOpen;
                                                            return <IconComponent size={16} />;
                                                        })()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">{sub}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400">
                                                        R$ {calculateTotal(category, sub).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>

                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setMenuOpenId(menuOpenId === `sub-${category}-${sub}` ? null : `sub-${category}-${sub}`)}
                                                            className="p-1 opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-sky-600 transition-all"
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>

                                                        {/* Sub Menu */}
                                                        {menuOpenId === `sub-${category}-${sub}` && (
                                                            <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-slate-100 rounded-xl shadow-xl z-30 overflow-hidden">
                                                                <button
                                                                    onClick={() => openEditModal('subcategory', category, sub)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                                                >
                                                                    <Edit2 size={12} /> Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete('subcategory', category, sub)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                                                                >
                                                                    <Trash2 size={12} /> Excluir
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => openAddSubModal(category)}
                                            className="w-full py-2 my-1 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all text-xs font-bold flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} /> Adicionar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal (Redesigned) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-100 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <span className="text-xs font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full">
                                {editValue ? 'Editar' : 'Nova'} {editingType === 'category' ? 'Categoria' : 'Subcategoria'}
                            </span>
                            <h3 className="text-2xl font-black text-slate-800 mt-3 leading-tight">
                                {editValue ? 'Alterar Detalhes' : 'Criar Novo Item'}
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (editValue ? handleEdit() : (editingType === 'category' ? handleAddCategory() : handleAddSubcategory()))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold text-slate-700"
                                    placeholder={editingType === 'category' ? "Ex: Investimentos" : "Ex: Ações"}
                                />
                            </div>

                            {/* Icon Picker */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ícone</label>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sky-500 w-24 text-right"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                                    {filteredIconKeys.map((iconKey) => {
                                        const IconComp = ICON_MAP[iconKey];
                                        const isSelected = selectedIcon === iconKey;
                                        return (
                                            <button
                                                key={iconKey}
                                                onClick={() => setSelectedIcon(iconKey)}
                                                className={`aspect-square flex items-center justify-center rounded-2xl border transition-all ${isSelected
                                                    ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-200 transform scale-105'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                                                    }`}
                                                title={iconKey}
                                            >
                                                <IconComp size={20} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {editingType === 'subcategory' && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Categoria Pai</span>
                                    <span className="font-black text-slate-700">{targetCategory}</span>
                                </div>
                            )}

                            <button
                                onClick={() => editValue ? handleEdit() : (editingType === 'category' ? handleAddCategory() : handleAddSubcategory())}
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} />
                                {editValue ? 'Salvar Alterações' : 'Confirmar Criação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
