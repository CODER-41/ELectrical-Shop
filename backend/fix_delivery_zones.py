import sys
sys.path.insert(0, '/home/kelvin/Development/Phase-5/ELectrical-Shop/backend')

# Read the file
with open('app/routes/delivery.py', 'r') as f:
    content = f.read()

# Replace the problematic query
old_code = '''            # Count agents assigned to this zone
            agent_count = DeliveryAgentProfile.query.filter(
                DeliveryAgentProfile.assigned_zones.contains([zone.id])
            ).count()'''

new_code = '''            # Count agents assigned to this zone
            agent_count = DeliveryAgentProfile.query.filter(
                DeliveryAgentProfile.assigned_zones.isnot(None),
                DeliveryAgentProfile.assigned_zones.contains([zone.id])
            ).count()'''

content = content.replace(old_code, new_code)

# Write back
with open('app/routes/delivery.py', 'w') as f:
    f.write(content)

print("✓ Fixed delivery zones query")
