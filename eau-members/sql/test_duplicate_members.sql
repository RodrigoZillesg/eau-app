-- Script para criar membros de teste com duplicatas
-- Execute este script no Supabase Studio para testar o sistema

-- Inserir alguns membros de teste com potenciais duplicatas
INSERT INTO members (first_name, last_name, email, phone, company_name, address, city, state, postal_code, country, membership_type, membership_status)
VALUES 
-- Grupo 1: John Smith (duplicata exata de nome)
('John', 'Smith', 'john.smith@example.com', '+61 412 345 678', 'Acme Corp', '123 Main St', 'Sydney', 'NSW', '2000', 'Australia', 'individual', 'active'),
('John', 'Smith', 'j.smith@gmail.com', '+61 412 345 679', 'Acme Corporation', '123 Main Street', 'Sydney', 'NSW', '2000', 'Australia', 'individual', 'active'),

-- Grupo 2: Maria Silva (nome similar, mesma empresa)
('Maria', 'Silva', 'maria.silva@techco.com', '+61 423 456 789', 'Tech Solutions', '456 George St', 'Melbourne', 'VIC', '3000', 'Australia', 'corporate', 'active'),
('Maria Clara', 'Silva', 'msilva@techco.com', '+61 423 456 789', 'Tech Solutions', '456 George St', 'Melbourne', 'VIC', '3000', 'Australia', 'corporate', 'active'),

-- Grupo 3: Robert Johnson (mesmo telefone e endereço)
('Robert', 'Johnson', 'rob.johnson@email.com', '+61 434 567 890', 'Johnson Enterprises', '789 King St', 'Brisbane', 'QLD', '4000', 'Australia', 'individual', 'active'),
('Bob', 'Johnson', 'bob.j@email.com', '+61 434 567 890', 'Johnson Ent.', '789 King St', 'Brisbane', 'QLD', '4000', 'Australia', 'individual', 'active'),

-- Grupo 4: Sarah Williams (email similar)
('Sarah', 'Williams', 'sarah.williams@university.edu.au', '+61 445 678 901', 'University of Sydney', '100 Campus Dr', 'Sydney', 'NSW', '2006', 'Australia', 'student', 'active'),
('Sarah', 'Williams', 'swilliams@university.edu.au', '+61 445 678 902', 'Uni of Sydney', '100 Campus Drive', 'Sydney', 'NSW', '2006', 'Australia', 'student', 'active'),

-- Grupo 5: Michael Brown (nome levemente diferente)
('Michael', 'Brown', 'michael.brown@consulting.com', '+61 456 789 012', 'Brown Consulting', '200 Collins St', 'Melbourne', 'VIC', '3001', 'Australia', 'individual', 'active'),
('Mike', 'Brown', 'mike.brown@consulting.com', '+61 456 789 013', 'Brown Consultancy', '200 Collins Street', 'Melbourne', 'VIC', '3001', 'Australia', 'individual', 'active'),

-- Membros únicos (não duplicados)
('Emma', 'Davis', 'emma.davis@design.com', '+61 467 890 123', 'Creative Designs', '50 Queen St', 'Perth', 'WA', '6000', 'Australia', 'individual', 'active'),
('James', 'Wilson', 'james.wilson@finance.com', '+61 478 901 234', 'Wilson Finance', '75 Pitt St', 'Sydney', 'NSW', '2001', 'Australia', 'corporate', 'active'),
('Lisa', 'Anderson', 'lisa.anderson@health.org', '+61 489 012 345', 'Health Services', '30 Hospital Rd', 'Adelaide', 'SA', '5000', 'Australia', 'institutional', 'active')
ON CONFLICT (email) DO NOTHING;