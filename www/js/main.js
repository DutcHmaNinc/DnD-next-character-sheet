var $sheet, $char, $class, $classJson, $classFile, $race, $raceJson, $raceFile, $background, $backgroundJson, $backgroundFile;

// LOAD SHEET AND CHARACTER
$.when(
    $.getJSON("json/sheet.json", function(data) { $sheet = data; }),
    $.getJSON("json/characters/calan.json", function(data) { $char = data; })
).then(function() {

	// DESIDE ON WHICH CLASS, RACE, AND BACKGROUND TO LOAD FROM CHARACTER JSON
	$classJson = $char.character.char_class.type;
	$classFile = 'json/classes/' + $classJson + '.json';
	$raceJson = $char.character.race.type;
	$raceFile = 'json/races/' + $raceJson + '.json';
	$backgroundJson = $char.character.background.type;
	$backgroundFile = 'json/backgrounds/' + $backgroundJson + '.json';
	
	// LOAD THE FILES
	$.when(	
		$.getJSON($classFile, function(data) { $class = data; }),
		$.getJSON($raceFile, function(data) { $race = data; }),
		$.getJSON($backgroundFile, function(data) { $background = data; })
	).then(function() {
	
		// LOG ALL DATA 
		$sheet ? console.log("Sheet successfully loaded") : console.log( "Error in sheet" );
		$char ? console.log("Character successfully loaded") : console.log( "Error in character" );
		$class ? console.log("Class successfully loaded") : console.log( "Error in class" );
		$race ? console.log("Race successfully loaded") : console.log( "Error in race" );
		$background ? console.log("Background successfully loaded") : console.log( "Error in background" );
		
		// START BUILDING SHEET IF ALL FILES ARE LOADED
		if ($sheet && $char && $class && $race && $background) {
		
			// LESS TYPING VAR'S
			var myChar = $char.character, 
				charClass = $class.charClass, 
				charSheet = $sheet.sheet, 
				charRace = $race.charRace,
				charBackground = $background.charBackground,
				// DATA STORAGE
				skillsData = [],
				abilitiesData = [],
				featsData = [];
		
			// CHARACTER INFO
			var cName = myChar.name,
				cRace = charRace.name,
				cBackground = charBackground.name,
				cClass = charClass.name;
				
			$('#characterName').append(
			'<p>Name: </p><h1>' + cName +
			'</h1>');
			$('#characterInfo .panel-body').append(
				'<p><span>Race: </span>' + cRace +
				'<br  /><span>Background: </span>'+ cBackground +
				'<br  /><span>Class: </span>'+ cClass +
				'</p>');			
			
			// GET LEVEL
			var xp = myChar.experience, xpList = charSheet.level, level;
				
			for ( var i = 0; i < xpList.length ; i++ ) {
				if ( xpList[i] > xp) break;
				level = i + 1;
			}
			console.log("Level: " + level);

			// FEATURES	
			var classfeatures = charClass.features,
				featuresKey = Object.keys(classfeatures),
				featuresData = [],
				featureAdjustData = [],
				activeFeaturesKey;
			
			featuresKey.forEach(function(feature){
				classfeatures[feature].level <= level ? featuresData[feature] = true : "";
			});
			console.log(featuresData);
			
			// ACTIVE FEATURES			
			Object.keys(featuresData).forEach(function(feature){
				$('#features .list-group').append(
					'<li class="list-group-item">' + classfeatures[feature].name + '</li>'
				);
				
				// LOOK FOR FEATURE STAT ADJUSTMENT
				
				if( classfeatures[feature].adjust ) {
					var fa = classfeatures[feature],
						adjust = fa.adjust,
						modifier;
					
					if (fa.level_progression) {
						for ( var i = 0; i < fa.level_progression.length ; i++ ) {
							if ( fa.level_progression[i] > level) break;
							modifier = fa.value[i];
						}
					} else {
						modifier = fa.value
					}
					featureAdjustData[adjust] = modifier
				}
			});
			console.log(featureAdjustData);			
			
			// Get Proficiency Bonus
			var	sheetPB = charSheet.proficiency_bonus,
				lvlProgPB = sheetPB.level_progression,
				valuePB = sheetPB.value,
				proficiencyBonus;
			
			for ( var i = 0; i < lvlProgPB.length ; i++ ) {
				if ( lvlProgPB[i] > level) break;
				proficiencyBonus = valuePB[i];
			}
			console.log("Proficiency Bonus: " + proficiencyBonus);	
			
			// Race data
			
			var myRace = myChar.race,
				isVariant = myRace.variant ? true : false;				
			
			if(isVariant) {
				myRace.variant_choises.abilities_increase.forEach(function(ability){
					abilitiesData[ability] = charRace.variant.abilities_increase.increase
				});
				myRace.variant_choises.skills.forEach(function(skill){
					skillsData[skill] = true
				});
				myRace.variant_choises.feats.forEach(function(feat){
					featsData[feat] = true
				});
				// TODO: languages
				console.log(abilitiesData);
			} else {
				// TODO: Wat te doen als het geen variant is.
			}
			
			// Class en Background Skills			
			myChar.char_class.skills.forEach(function(skill){
				skillsData[skill] = true
			});
			myChar.background.skills.forEach(function(skill){
				skillsData[skill] = true
			});
			console.log(skillsData);
			console.log(featsData);
			
			// FEATS
			
			var featsAdjustData = [];
			
			Object.keys(featsData).forEach(function(feat){
				$('#feats .list-group').append(
					'<li class="list-group-item">' + charSheet.feats[feat].name + '</li>'
				);
				
				if( charSheet.feats[feat].adjust ) {
					var ft = charSheet.feats[feat],
						adjust = ft.adjust,
						modifier;
					
					if (ft.level_progression) {
						for ( var i = 0; i < ft.level_progression.length ; i++ ) {
							if ( ft.level_progression[i] > level) break;
							modifier = ft.value[i];
						}
					} else {
						modifier = ft.value
					}
					featsAdjustData[adjust] = modifier
				}

				
			});
				
			
			console.log(featsAdjustData);
			
			// Abilities and saving throws
			var sheetAbilities = charSheet.abilities,
				charAbilities = myChar.abilities,
				classAbilities = charClass.abilities,
				abilityKey = Object.keys(sheetAbilities),
				modifierData = [];

			abilityKey.forEach(function(ability) {
				var onSheet	= sheetAbilities[ability],
					onChar = charAbilities[ability],
					onClass = classAbilities[ability],
					raceValue = abilitiesData[ability] ? abilitiesData[ability] : 0,
					baseValue = onChar.base_value + raceValue,
					tempModifier = onChar.temp_modifier,
					itemModifier = 0,
					endScore = baseValue + tempModifier + itemModifier,
					modifier = Math.floor((endScore - 10) / 2),
					skilled = onClass ? onClass.saving_throw.skilled : onSheet.saving_throw.skilled,
					isSkilled = skilled ? "Yes" : "No",
					savingThrowModifier = skilled ? proficiencyBonus + modifier : modifier;
					
				$('#abilities > .table-responsive table.table tbody').append(
					'<tr><td><span>' + onSheet.name + 
					'</span></td><td><span>' + baseValue + 
					'</span></td><td><span>' + tempModifier + 
					'</span></td><td><span>' + itemModifier + 
					'</span></td><td><span>' + endScore + 
					'</span></td><td><span>' + ( modifier == 0 ? modifier : '+' + modifier ) + 
					'</span></td><td><span>' + isSkilled + 
					'</span></td><td><span>' + ( savingThrowModifier == 0 ? savingThrowModifier : '+' + savingThrowModifier ) +
					'</span></td></tr>'
				);
				modifierData[ability] = modifier;
			});		
			console.log(modifierData);
			
			// Skills
			
			var sheetSkills = charSheet.skills,
				skillsKey = Object.keys(sheetSkills);

			skillsKey.forEach(function(skill) {
				var onSheet = sheetSkills[skill],
					keyAbility = onSheet.key_ability,
					modifier = modifierData[keyAbility],
					skilled = skillsData[skill] ? true : false,
					isSkilled = skilled ? "Yes" : "No",
					bonus = skilled ? proficiencyBonus + modifier : modifier;					
				
				$('#skills > .table-responsive table.table tbody').append(
					'<tr><td><span>' + onSheet.name + 
					'</span></td><td><span>' + sheetAbilities[keyAbility].name + 
					'</span></td><td><span>' + isSkilled + 
					'</span></td><td><span>' + ( bonus == 0 ? bonus : '+' + bonus ) + 
					'</span></td></tr>'
				);
			});

			// Vullen data voor algemene informatie
			
			var passiveWisdom = 10 + (modifierData["wisdom"]) + (skillsData["perception"] ? proficiencyBonus : 0),
				passiveWisdomName = "Passive wisdom",
				passiveIntelligence = 10 + (modifierData["intelligence"]) + (skillsData["investigation"] ? proficiencyBonus : 0)
				passiveIntelligenceName = "Passive Intelligence",
				speed = charRace.base_speed + (featureAdjustData["speed"] ? featureAdjustData["speed"] : 0) + (featsAdjustData["speed"] ? featsAdjustData["speed"] : 0),
				speedName = "Speed",
				initiative = modifierData["dexterity"],
				initiativeName = "Initiative";
			
			$('#stats .list-group').append(
				'<li class="list-group-item"><span class="badge">' + proficiencyBonus + 
				'</span>' + charSheet.proficiency_bonus.name +
				'</li><li class="list-group-item"><span class="badge">' + initiative +
				'</span>' + initiativeName +
				'</li><li class="list-group-item"><span class="badge">' + speed +
				'</span>' + speedName +
				'</li><li class="list-group-item"><span class="badge">' + passiveWisdom +
				'</span>' + passiveWisdomName +
				'</li><li class="list-group-item"><span class="badge">' + passiveIntelligence +
				'</span>' + passiveIntelligenceName +
				'</li>'
			);
		}
	})	
});

